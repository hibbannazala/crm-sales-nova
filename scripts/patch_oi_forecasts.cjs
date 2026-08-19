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
  console.log('Fetching oiForecasts from Firestore...');
  const snap = await db.collection('oiForecasts').get();
  
  let successCount = 0;
  let failCount = 0;

  for (const doc of snap.docs) {
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
      if (error) {
        console.error(`Failed to update ${id}:`, error.message);
        failCount++;
      } else {
        successCount++;
      }
    }
  }

  console.log(`Finished patching! Success: ${successCount}, Failed: ${failCount}`);
}

run().catch(console.error);
