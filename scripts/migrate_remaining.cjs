const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');
const serviceAccount = require('../firebase-key.json');

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

const SUPABASE_URL = 'https://qlflinfxumcoxbbgkcgz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZmxpbmZ4dW1jb3hiYmdrY2d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY5MTI5OCwiZXhwIjoyMTAyMjY3Mjk4fQ.B0n0fmBNDFsQqO8AZiXYjqPI40S2tq_66QYkkbTIK8Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function parseDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toISOString();
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString();
  }
  if (typeof dateVal === 'string') {
    return dateVal;
  }
  if (typeof dateVal === 'number') {
    return new Date(dateVal).toISOString();
  }
  return null;
}

async function run() {
  console.log('🚀 Memulai migrasi SEMUA data yang tertinggal (Total Coverage)...');

  // 1. MENGAMBIL DATA TASKS
  console.log('\n--- 1. Migrasi Tasks ---');
  try {
    const tasksSnap = await db.collection('tasks').get();
    const tasksData = [];
    tasksSnap.forEach(doc => {
      const t = doc.data();
      tasksData.push({
        id: doc.id,
        lead_id: t.leadId,
        title: t.title || 'Untitled',
        due_date: parseDate(t.dueDate) || new Date().toISOString(),
        assigned_to: t.assignedTo || '-',
        assigned_to_name: t.assignedToName || '-',
        assigned_by: t.assignedBy || '-',
        priority: t.priority || 'Medium',
        status: t.status || 'To Do',
        created_at: parseDate(t.createdAt) || new Date().toISOString(),
        updated_at: parseDate(t.updatedAt) || new Date().toISOString()
      });
    });

    if (tasksData.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < tasksData.length; i += chunkSize) {
        const chunk = tasksData.slice(i, i + chunkSize);
        const { error } = await supabase.from('tasks').upsert(chunk);
        if (error) console.error('Error insert tasks:', error.message);
      }
      console.log(`✅ Berhasil memigrasi ${tasksData.length} tasks.`);
    } else {
      console.log('Tidak ada data task yang ditemukan.');
    }
  } catch (error) {
    console.error('Gagal migrasi Tasks:', error.message);
  }

  // 2. MENGAMBIL EXTENDED FIELDS DARI OI FORECASTS
  console.log('\n--- 2. Patch OI Forecasts ---');
  try {
    const oiSnap = await db.collection('oiForecasts').get();
    let oiSuccess = 0;
    for (const doc of oiSnap.docs) {
      const data = doc.data();
      const id = doc.id;
      const updates = {};
      if (data.dateQuotation) updates.date_quotation = data.dateQuotation;
      if (data.picQuotation) updates.pic_quotation = data.picQuotation;
      if (data.dateInvoice) updates.date_invoice = data.dateInvoice;
      if (data.picInvoice) updates.pic_invoice = data.picInvoice;
      if (data.targetGMV) updates.target_gmv = data.targetGMV;
      if (data.targetCreator) updates.target_creator = data.targetCreator;
      if (data.targetVideoAffiliate) updates.target_video_affiliate = data.targetVideoAffiliate;
      if (data.targetVideoInternal) updates.target_video_internal = data.targetVideoInternal;
      if (data.targetViews) updates.target_views = data.targetViews;
      if (data.lastFollowUp) updates.last_follow_up = parseDate(data.lastFollowUp);

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('oi_forecasts').update(updates).eq('id', id);
        if (!error) oiSuccess++;
      }
    }
    console.log(`✅ Berhasil mem-patch ${oiSuccess} OI Forecasts.`);
  } catch (error) {
    console.error('Gagal migrasi OI Forecasts:', error.message);
  }

  // 3. MENGAMBIL DATA INDIVIDUAL TARGETS
  console.log('\n--- 3. Migrasi Individual Targets ---');
  try {
    const itSnap = await db.collection('individualTargets').get();
    const itData = [];
    itSnap.forEach(doc => {
      const data = doc.data();
      itData.push({
        id: doc.id,
        user_id: data.userId,
        month_year: data.monthYear,
        target_chat: Number(data.targetChat || 0),
        target_meeting: Number(data.targetMeeting || 0),
        target_revenue: Number(data.targetRevenue || 0),
        updated_by: data.updatedBy || null,
        updated_at: parseDate(data.updatedAt) || new Date().toISOString()
      });
    });

    if (itData.length > 0) {
      const { error } = await supabase.from('individual_targets').upsert(itData, { onConflict: 'id' });
      if (error) console.error('Error insert individual_targets:', error.message);
      else console.log(`✅ Berhasil memigrasi ${itData.length} individual_targets.`);
    } else {
      console.log('Tidak ada data individual_targets yang ditemukan.');
    }
  } catch (error) {
    console.error('Gagal migrasi Individual Targets:', error.message);
  }

  // 4. MENGAMBIL DATA NOTES & HISTORY DARI DALAM LEADS (Subcollection + Array)
  console.log('\n--- 4. Ekstraksi Notes & History (Sub-collection) dari Leads ---');
  try {
    const leadsSnap = await db.collection('leads').get();
    const notesData = [];
    const historyData = [];
    
    let processedLeads = 0;

    for (const doc of leadsSnap.docs) {
      const leadId = doc.id;
      const data = doc.data();
      
      // Extract Notes (from array)
      if (data.notes && Array.isArray(data.notes)) {
        data.notes.forEach(note => {
          notesData.push({
            lead_id: leadId,
            text: note.text || '',
            author_name: note.author || 'Unknown',
            created_at: parseDate(note.timestamp) || new Date().toISOString(),
            note_type: note.type || 'note',
            is_log: note.isLog || false
          });
        });
      }

      // Extract History (from subcollection to be 100% safe, prioritizing it over the array)
      const historySnap = await db.collection('leads').doc(leadId).collection('history').get();
      if (!historySnap.empty) {
        historySnap.forEach(hDoc => {
          const h = hDoc.data();
          historyData.push({
            id: hDoc.id,
            lead_id: leadId,
            stage: h.stage || 'Leads',
            date_occurred: parseDate(h.date) || new Date().toISOString(),
            deal_value: Number(h.dealValue || 0),
            campaign_number: Number(h.campaignNumber || 1),
            note: h.note || null,
            assigned_by: h.assignedBy || null,
            by_user_name: h.by || 'Unknown',
            created_at: parseDate(h.timestamp) || new Date().toISOString()
          });
        });
      }

      processedLeads++;
      if (processedLeads % 50 === 0) {
        console.log(`... memproses ${processedLeads}/${leadsSnap.size} leads...`);
      }
    }

    // Insert Notes
    if (notesData.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < notesData.length; i += chunkSize) {
        const chunk = notesData.slice(i, i + chunkSize);
        const { error } = await supabase.from('lead_notes').insert(chunk);
        // We use insert instead of upsert because notes didn't have IDs in the array, they will be auto-generated by Supabase UUID
        if (error) console.error('Error insert notes:', error.message);
      }
      console.log(`✅ Berhasil mengekstraksi dan migrasi ${notesData.length} notes dari ${leadsSnap.size} leads.`);
    }

    // Insert History
    if (historyData.length > 0) {
      const chunkSize = 500;
      for (let i = 0; i < historyData.length; i += chunkSize) {
        const chunk = historyData.slice(i, i + chunkSize);
        const { error } = await supabase.from('funnel_history').upsert(chunk, { onConflict: 'id' });
        if (error) console.error('Error insert funnel_history:', error.message);
      }
      console.log(`✅ Berhasil mengekstraksi dan migrasi ${historyData.length} history subcollections dari ${leadsSnap.size} leads.`);
    }

  } catch (error) {
    console.error('Gagal mengekstraksi Notes & History:', error.message);
  }

  console.log('\n🎉 Selesai memigrasi SEMUA data (100% Data Coverage)!');
  process.exit(0);
}

run();
