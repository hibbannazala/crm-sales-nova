const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../next-crm/src/components/LeadsClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace imports
content = content.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useRouter } from 'next/navigation';"
);
content = content.replace(
  "import { db } from '../firebase';\nimport { doc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';",
  "import { createClient } from '@/utils/supabase/client';"
);

// 2. Add 'use client'
content = "'use client';\n" + content;

// 3. Rename component Dashboard -> LeadsClient
content = content.replace(
  "export default function Dashboard({",
  "export default function LeadsClient({"
);

// 4. Replace useNavigate
content = content.replace(/const navigate = useNavigate\(\);/g, "const router = useRouter();\n  const supabase = createClient();");
content = content.replace(/navigate\(/g, "router.push(");

// 5. Replace fixSuperImportData logic with a Supabase equivalent or disable it
// We will just comment out the body of fixSuperImportData and handleGlobalSync for now since they are utility functions
content = content.replace(/const handleGlobalSync = async \(\) => {[\s\S]*?};/g, `const handleGlobalSync = async () => { alert("Global sync moved to Supabase SQL"); };`);
content = content.replace(/const fixSuperImportData = async \(\) => {[\s\S]*?};/g, `const fixSuperImportData = async () => { alert("Fix script moved to Supabase"); };`);

// 6. Fix types imports (assuming types are in @/types now)
content = content.replace(/from '\.\.\/types'/g, "from '@/types'");
content = content.replace(/from '\.\.\/lib\/utils'/g, "from '@/lib/utils'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactored LeadsClient.tsx');
