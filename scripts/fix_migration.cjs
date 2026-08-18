const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');

const serviceAccount = require('../firebase-key.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const SUPABASE_URL = 'https://qlflinfxumcoxbbgkcgz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZmxpbmZ4dW1jb3hiYmdrY2d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY5MTI5OCwiZXhwIjoyMTAyMjY3Mjk4fQ.B0n0fmBNDFsQqO8AZiXYjqPI40S2tq_66QYkkbTIK8Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function parseDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString();
  if (dateVal instanceof Date) return dateVal.toISOString();
  if (typeof dateVal === 'number') return new Date(dateVal).toISOString();
  if (typeof dateVal === 'string') {
    const parts = dateVal.split(/[-T/]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const p1 = parseInt(parts[1]);
      const p2 = parseInt(parts[2].substring(0,2));
      if (year > 2000 && p1 > 12 && p2 <= 12) {
        return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }
  return null;
}

async function fix() {
  console.log('Mencoba menyuntikkan 2 Leads yang terlewat...');
  const missingLeads = ['NY6MtTNIwenliCMs5EbY', 'cdrbBN5XErQSHksqsq0d'];
  for (const id of missingLeads) {
    const doc = await db.collection('leads').doc(id).get();
    if (doc.exists) {
      const leadData = doc.data();
      const supabaseLead = {
        id: doc.id,
        date_input: parseDate(leadData.dateInput),
        category: leadData.category || '-',
        brand_name: leadData.brandName || '-',
        contact: leadData.contact || '-',
        lead_source: leadData.leadSource || '-',
        status: leadData.status || 'Leads',
        interest_level: leadData.interestLevel || '-',
        product_offered: leadData.productOffered || [],
        action_plan: leadData.actionPlan || null,
        date_chated: parseDate(leadData.dateChated),
        date_responsed: parseDate(leadData.dateResponsed),
        date_set_meeting: parseDate(leadData.dateSetMeeting),
        date_closed: parseDate(leadData.dateClosed),
        date_failed: parseDate(leadData.dateFailed),
        deal_value: leadData.dealValue || 0,
        is_deleted: leadData.isDeleted || false
      };
      const { error } = await supabase.from('leads').upsert(supabaseLead);
      if (error) console.log(`Gagal lagi lead ${id}:`, error.message);
      else console.log(`✅ Berhasil import lead ${id}`);
      
      if (leadData.funnelHistory) {
        const historyArray = leadData.funnelHistory.map(h => ({
          lead_id: doc.id,
          stage: h.stage,
          date_occurred: parseDate(h.date || h.timestamp) || new Date().toISOString(),
          by_user_name: h.by || 'Unknown',
          note: h.note || null,
          deal_value: h.dealValue || null,
          created_at: parseDate(h.timestamp) || new Date().toISOString()
        }));
        if (historyArray.length > 0) {
          await supabase.from('funnel_history').upsert(historyArray);
        }
      }
    }
  }

  console.log('\nMencoba ulang Migrasi Edit Requests satu-per-satu...');
  const editSnap = await db.collection('editRequests').get();
  let successCount = 0;
  for (const doc of editSnap.docs) {
    const data = doc.data();
    const req = {
      id: doc.id,
      lead_id: data.leadId,
      old_brand: data.oldBrand,
      new_brand: data.newBrand,
      old_contact: data.oldContact,
      new_contact: data.newContact,
      requested_by_name: data.requestedBy,
      status: data.status || 'pending',
      created_at: parseDate(data.timestamp) || new Date().toISOString()
    };
    const { error } = await supabase.from('edit_requests').upsert(req);
    if (error) {
      console.log(`EditRequest ${doc.id} (Lead: ${data.leadId}) gagal: ${error.message}`);
    } else {
      successCount++;
    }
  }
  console.log(`✅ Berhasil migrasi ${successCount} edit requests.`);
}

fix();
