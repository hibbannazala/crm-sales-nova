const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '../next-crm/src/components/LeadsClient.tsx'),
  path.join(__dirname, '../next-crm/src/components/BulkStatusModal.tsx')
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace batch updates with Supabase equivalent (we'll just use a loop or Promise.all for simplicity in migration)
  // Firebase: const batch = writeBatch(db); ... batch.update(doc(db, "leads", id), updates); ... await batch.commit();
  // Supabase: await supabase.from('leads').update(updates).eq('id', id);
  
  content = content.replace(/const batch = writeBatch\(db\);/g, "const promises = [];");
  content = content.replace(/batch\.update\(doc\(db, "leads", ([^)]+)\), ([\s\S]*?)\);/g, "promises.push(supabase.from('leads').update($2).eq('id', $1));");
  content = content.replace(/await batch\.commit\(\);/g, "await Promise.all(promises);");
  
  // Single updates
  content = content.replace(/await updateDoc\(doc\(db, "leads", ([^)]+)\), ([\s\S]*?)\);/g, "await supabase.from('leads').update($2).eq('id', $1);");
  
  // BulkStatusModal imports
  if (file.includes('BulkStatusModal')) {
    content = content.replace(/import { db } from '\.\.\/firebase';\nimport { doc, writeBatch } from 'firebase\/firestore';/, "import { createClient } from '@/utils/supabase/client';");
    content = content.replace(/export default function BulkStatusModal\(\{([^)]+)\}\) \{/, "export default function BulkStatusModal({$1}) {\n  const supabase = createClient();");
  }

  // Next/Link
  content = content.replace(/import { Link } from 'react-router-dom';/g, "import Link from 'next/link';");

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Refactored ${file}`);
}
