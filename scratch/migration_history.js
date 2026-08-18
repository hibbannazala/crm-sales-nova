import { db } from './src/firebase';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

async function migrateHistory() {
  console.log("🚀 Memulai migrasi histori ke sub-collection...");
  
  try {
    const leadsSnap = await getDocs(collection(db, "leads"));
    console.log(`📦 Ditemukan ${leadsSnap.size} leads.`);

    let migratedLeads = 0;
    let totalEntries = 0;

    for (const leadDoc of leadsSnap.docs) {
      const leadData = leadDoc.data();
      const history = leadData.funnelHistory || [];

      if (history.length > 0) {
        console.log(`📝 Memproses ${leadData.brandName} (${history.length} entri)...`);
        
        for (const entry of history) {
          // Generate an ID based on timestamp and stage to avoid duplicates if re-run
          const entryId = `${entry.timestamp}_${entry.stage.replace(/\s+/g, '_')}`;
          const historyRef = doc(db, "leads", leadDoc.id, "history", entryId);
          
          await setDoc(historyRef, {
            ...entry,
            migrated: true
          }, { merge: true });
          
          totalEntries++;
        }
        migratedLeads++;
      }
    }

    console.log(`✅ SELESAI!`);
    console.log(`📊 Leads diproses: ${migratedLeads}`);
    console.log(`📊 Total entri dipindahkan: ${totalEntries}`);
    console.log(`\nSilakan verifikasi data di panel Lead Detail.`);

  } catch (error) {
    console.error("❌ Gradasi Migrasi Gagal:", error);
  }
}

migrateHistory();
