import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('D:/crm-sales-tnt-v2/firebase-key.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function analyze() {
  console.log("Mulai memindai database...");
  
  try {
    const collections = ['users', 'leads', 'editRequests', 'tasks', 'globalTargets', 'individualTargets', 'globalAuditLogs', 'oiForecasts'];
    const stats: any = {};
    let totalDocuments = 0;

    for (const col of collections) {
      const snap = await db.collection(col).get();
      stats[col] = snap.size;
      totalDocuments += snap.size;
    }
    
    // Khusus untuk leads, mari kita periksa sub-collection history dari beberapa leads teratas
    const leadsSnap = await db.collection('leads').limit(50).get();
    let sampleHistoryCount = 0;
    
    for (const doc of leadsSnap.docs) {
       const historySnap = await doc.ref.collection('history').get();
       sampleHistoryCount += historySnap.size;
    }

    console.log("\n=== HASIL ANALISIS FIRESTORE ===");
    console.log(`Total Dokumen Utama yang ditemukan: ${totalDocuments}`);
    console.log("\nRincian per koleksi:");
    for (const [col, count] of Object.entries(stats)) {
       console.log(`- ${col}: ${count} dokumen`);
    }
    
    console.log(`\n(Sampling) Dari 50 leads teratas, terdapat ${sampleHistoryCount} dokumen history tersembunyi.`);
    console.log("=================================\n");
    
    if (stats['leads'] > 5000) {
       console.log("⚠️ PERINGATAN: Jumlah leads Anda sudah cukup besar! Metode onSnapshot di React saat ini berisiko membuat aplikasi lambat.");
    } else {
       console.log("✅ Jumlah data saat ini masih dalam batas aman untuk performa aplikasi (di bawah 5.000). Namun tetap disarankan untuk memikirkan migrasi.");
    }
    
  } catch (err: any) {
    console.error("Terjadi kesalahan saat memindai:", err.message);
  }
}

analyze();
