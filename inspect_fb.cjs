const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-key.json');

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function inspectTasks() {
  const snap = await db.collection('tasks').limit(1).get();
  if (snap.empty) {
    console.log('Collection tasks is empty.');
  } else {
    snap.forEach(doc => {
      console.log(`Doc ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });
  }
}

inspectTasks().catch(console.error);
