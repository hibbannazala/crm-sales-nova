const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../next-crm/src/components/ImportModalClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix lucide-react imports
content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Plus, Edit3, Calendar, AlertTriangle } from 'lucide-react';");

// Fix useCategories import
content = content.replace(/import \{ useCategories \} from '\.\.\/hooks\/useCategories';/, "import { useCategories } from '@/hooks/useCategories';");

// Fix any implicitly type
content = content.replace(/categories\.map\(c =>/g, "categories.map((c: any) =>");

// Fix remaining batch logic for basic mode insert
content = content.replace(/const batch = writeBatch\(db\);\n\s*const slice = batchData\.slice\(i, i \+ chunkSize\);\n\s*for \(const ld of slice\) \{\n\s*const ref = ld\.id \? doc\(db, "leads", ld\.id\) : doc\(collection\(db, "leads"\)\);\n\s*const payload = \{ \.\.\.ld, updatedAt: new Date\(\)\.toISOString\(\) \};\n\s*batch\.set\(ref, payload, \{ merge: true \}\);\n\s*\}\n\s*await batch\.commit\(\);/g, 
  `const slice = batchData.slice(i, i + chunkSize);
   const payloads = slice.map(ld => mapLeadToSupabase(ld));
   await supabase.from('leads').upsert(payloads);`
);

// Fix remaining batch logic for individual mode update (status)
content = content.replace(/const batch = writeBatch\(db\);\n\s*const slice = batchData\.slice\(i, i \+ chunkSize\);\n\s*for \(const ld of slice\) \{\n\s*const ref = doc\(db, "leads", ld\.id\);\n\s*batch\.set\(ref, \{ funnelHistory: ld\.funnelHistory, status: ld\.status, updatedAt: new Date\(\)\.toISOString\(\) \}, \{ merge: true \}\);\n\s*\}\n\s*await batch\.commit\(\);/g, 
  `const slice = batchData.slice(i, i + chunkSize);
   for (const ld of slice) {
     await supabase.from('leads').update({ funnel_history: ld.funnelHistory, status: ld.status, updated_at: new Date().toISOString() }).eq('id', ld.id);
   }`
);

// Try replacing any leftover batch logic more generically if the indentations didn't match
content = content.replace(/const batch = writeBatch\(db\);/g, "// batch removed");
content = content.replace(/batch\.set\([^;]+\);/g, "// batch.set removed");
content = content.replace(/await batch\.commit\(\);/g, "// batch.commit removed");
content = content.replace(/const ref = doc\([^;]+\);/g, "// doc ref removed");
content = content.replace(/doc\(collection\([^;]+\)\)/g, "null");

fs.writeFileSync(filePath, content);
console.log("ImportModalClient fixed.");
