const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');

// Konfigurasi Firebase
const serviceAccount = require('../firebase-key.json');
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// Konfigurasi Supabase
const SUPABASE_URL = 'https://qlflinfxumcoxbbgkcgz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZmxpbmZ4dW1jb3hiYmdrY2d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY5MTI5OCwiZXhwIjoyMTAyMjY3Mjk4fQ.B0n0fmBNDFsQqO8AZiXYjqPI40S2tq_66QYkkbTIK8Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helper Function: Parse Invalid Dates & Firestore Timestamps
function parseDate(dateVal) {
  if (!dateVal) return null;
  
  // Jika object Firestore Timestamp
  if (typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toISOString();
  }
  
  // Jika object Date bawaan JS
  if (dateVal instanceof Date) {
    return dateVal.toISOString();
  }
  
  // Jika angka (milliseconds)
  if (typeof dateVal === 'number') {
    return new Date(dateVal).toISOString();
  }

  // Jika string, lakukan pembersihan format terbalik
  if (typeof dateVal === 'string') {
    const parts = dateVal.split(/[-T/]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const p1 = parseInt(parts[1]);
      const p2 = parseInt(parts[2].substring(0,2));
      
      // Fix YYYY-DD-MM format if day and month are flipped
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

async function migrateData() {
  console.log('🚀 Memulai Migrasi Data LENGKAP (8 Koleksi) dari Firestore ke Supabase...');

  try {
    // ==========================================
    // 1. Migrasi Users
    // ==========================================
    console.log('\n--- 1. Migrasi Users ---');
    const usersSnap = await db.collection('users').get();
    const usersData = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      usersData.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role || 'pending',
        created_at: new Date().toISOString()
      });
    });
    
    if (usersData.length > 0) {
      const { error } = await supabase.from('users').upsert(usersData);
      if (error) console.error('Error migrasi users:', error.message);
      else console.log(`✅ Berhasil memigrasi ${usersData.length} users.`);
    }

    // ==========================================
    // 2. Migrasi Settings (app_settings)
    // ==========================================
    console.log('\n--- 2. Migrasi Settings ---');
    const settingsSnap = await db.collection('settings').get();
    const settingsData = [];
    settingsSnap.forEach(doc => {
      settingsData.push({
        id: doc.id,
        data: doc.data(),
        updated_at: new Date().toISOString()
      });
    });

    if (settingsData.length > 0) {
      const { error } = await supabase.from('app_settings').upsert(settingsData);
      if (error) console.error('Error migrasi settings:', error.message);
      else console.log(`✅ Berhasil memigrasi ${settingsData.length} settings documents.`);
    }

    // ==========================================
    // 3. Migrasi Leads & Funnel History
    // ==========================================
    console.log('\n--- 3. Migrasi Leads & History ---');
    const leadsSnap = await db.collection('leads').get();
    let leadsCount = 0;
    let historyCount = 0;
    
    for (const leadDoc of leadsSnap.docs) {
      const leadData = leadDoc.data();
      
      const supabaseLead = {
        id: leadDoc.id,
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

      const { error: leadErr } = await supabase.from('leads').upsert(supabaseLead);
      if (leadErr) {
        console.error(`Gagal import lead ${leadDoc.id}:`, leadErr.message);
        continue;
      }
      leadsCount++;

      // History
      if (leadData.funnelHistory && Array.isArray(leadData.funnelHistory)) {
        const historyArray = leadData.funnelHistory.map(h => ({
          lead_id: leadDoc.id,
          stage: h.stage,
          date_occurred: parseDate(h.date || h.timestamp) || new Date().toISOString(),
          by_user_name: h.by || 'Unknown',
          note: h.note || null,
          deal_value: h.dealValue || null,
          created_at: parseDate(h.timestamp) || new Date().toISOString()
        }));

        if (historyArray.length > 0) {
          const { error: histErr } = await supabase.from('funnel_history').upsert(historyArray);
          if (histErr) console.error(`Error insert history lead ${leadDoc.id}:`, histErr.message);
          else historyCount += historyArray.length;
        }
      }
    }
    console.log(`✅ Berhasil memigrasi ${leadsCount} leads dan ${historyCount} history records.`);

    // ==========================================
    // 4. Migrasi Edit Requests
    // ==========================================
    console.log('\n--- 4. Migrasi Edit Requests ---');
    const editSnap = await db.collection('editRequests').get();
    const editData = [];
    editSnap.forEach(doc => {
      const data = doc.data();
      editData.push({
        id: doc.id,
        lead_id: data.leadId,
        old_brand: data.oldBrand,
        new_brand: data.newBrand,
        old_contact: data.oldContact,
        new_contact: data.newContact,
        requested_by_name: data.requestedBy,
        status: data.status || 'pending',
        created_at: parseDate(data.timestamp) || new Date().toISOString()
      });
    });
    
    if (editData.length > 0) {
      const { error } = await supabase.from('edit_requests').upsert(editData);
      if (error) console.error('Error migrasi edit requests:', error.message);
      else console.log(`✅ Berhasil memigrasi ${editData.length} edit requests.`);
    }

    // ==========================================
    // 5. Migrasi Global Audit Logs
    // ==========================================
    console.log('\n--- 5. Migrasi Global Audit Logs ---');
    const auditSnap = await db.collection('globalAuditLogs').get();
    const auditData = [];
    auditSnap.forEach(doc => {
      const data = doc.data();
      auditData.push({
        id: doc.id,
        action: data.action || '-',
        details: data.details || '-',
        user_name: data.user || 'System',
        created_at: parseDate(data.timestamp) || new Date().toISOString()
      });
    });

    if (auditData.length > 0) {
      const { error } = await supabase.from('global_audit_logs').upsert(auditData);
      if (error) console.error('Error migrasi audit logs:', error.message);
      else console.log(`✅ Berhasil memigrasi ${auditData.length} audit logs.`);
    }

    // ==========================================
    // 6. Migrasi Global Targets
    // ==========================================
    console.log('\n--- 6. Migrasi Global Targets ---');
    const globalSnap = await db.collection('globalTargets').get();
    const globalData = [];
    globalSnap.forEach(doc => {
      const data = doc.data();
      globalData.push({
        id: doc.id,
        month_year: data.monthYear || doc.id,
        target_chat: data.targetChat || 0,
        target_meeting: data.targetMeeting || 0,
        target_revenue: data.targetRevenue || 0,
        updated_at: parseDate(data.updatedAt) || new Date().toISOString()
      });
    });

    if (globalData.length > 0) {
      const { error } = await supabase.from('global_targets').upsert(globalData);
      if (error) console.error('Error migrasi global targets:', error.message);
      else console.log(`✅ Berhasil memigrasi ${globalData.length} global targets.`);
    }

    // ==========================================
    // 7. Migrasi OI Forecasts
    // ==========================================
    console.log('\n--- 7. Migrasi OI Forecasts ---');
    const oiSnap = await db.collection('oiForecasts').get();
    const oiData = [];
    oiSnap.forEach(doc => {
      const data = doc.data();
      oiData.push({
        id: doc.id,
        lead_id: data.leadId,
        month_year: data.monthYear || '-',
        product: data.product || '-',
        campaign_number: data.campaignNumber || null,
        budget_ads: data.budgetAds || 0,
        budget_creator: data.budgetCreator || 0,
        real_margin: data.realMargin || 0,
        real_payment: data.realPayment || 0,
        tier: data.tier || '-',
        category: data.category || '-',
        note_sales: data.noteSales || null,
        gross_margin: data.grossMargin || 0,
        value: data.value || 0,
        success_rate: data.successRate || 0,
        status: data.status || 'OPEN',
        created_at: parseDate(data.createdAt) || new Date().toISOString(),
        updated_at: parseDate(data.updatedAt) || new Date().toISOString()
      });
    });

    if (oiData.length > 0) {
      const { error } = await supabase.from('oi_forecasts').upsert(oiData);
      if (error) console.error('Error migrasi oi forecasts:', error.message);
      else console.log(`✅ Berhasil memigrasi ${oiData.length} OI forecasts.`);
    }

    // ==========================================
    // 8. Migrasi OI Targets
    // ==========================================
    console.log('\n--- 8. Migrasi OI Targets ---');
    const oiTargetsSnap = await db.collection('oiTargets').get();
    const oiTargetsData = [];
    oiTargetsSnap.forEach(doc => {
      const data = doc.data();
      oiTargetsData.push({
        id: doc.id,
        month_year: data.monthYear || '-',
        product: data.product || '-',
        target_value: data.targetValue || 0,
        updated_at: parseDate(data.updatedAt) || new Date().toISOString()
      });
    });

    if (oiTargetsData.length > 0) {
      const { error } = await supabase.from('oi_targets').upsert(oiTargetsData);
      if (error) console.error('Error migrasi oi targets:', error.message);
      else console.log(`✅ Berhasil memigrasi ${oiTargetsData.length} OI targets.`);
    }

    console.log('\n🎉 PROSES MIGRASI DATA LENGKAP SELESAI!');
  } catch (error) {
    console.error('❌ Terjadi Kesalahan Fatal:', error);
  }
}

migrateData();
