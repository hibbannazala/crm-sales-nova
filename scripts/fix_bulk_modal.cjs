const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../next-crm/src/components/BulkStatusModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace history subcollection set with array append
content = content.replace(
  /const newId = doc\(collection\(db, "leads", lead\.id, "history"\)\)\.id;\s*batch\.set\(doc\(db, "leads", lead\.id, "history", newId\), funnelEntry\);/g,
  "const updatedHistory = [...(lead.funnelHistory || []), funnelEntry]; promises.push(supabase.from('leads').update({ funnel_history: updatedHistory }).eq('id', lead.id));"
);

// Replace addDoc globalAuditLogs
content = content.replace(
  /await addDoc\(collection\(db, "globalAuditLogs"\), \{([\s\S]*?)\}\);/g,
  "await supabase.from('global_audit_logs').insert([{$1}]);"
);

// Replace the audit log limit query (we can just disable it in the frontend, let server handle it or ignore it)
content = content.replace(
  /const q = query\(collection\(db, "globalAuditLogs"\), orderBy\("timestamp", "desc"\)\);\s*const snap = await getDocs\(q\);\s*if \(snap\.size > 48\) \{[\s\S]*?\}\s*\}/g,
  "// Audit log limit check removed for Supabase"
);

// Replace the imports if any firestore imports are left
content = content.replace(
  /import \{ doc, writeBatch, addDoc, setDoc, query, where, getDocs, limit, collection, orderBy, deleteDoc \} from 'firebase\/firestore';/,
  ""
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed BulkStatusModal.tsx');
