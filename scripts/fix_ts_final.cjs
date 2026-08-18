const fs = require('fs');
const path = require('path');

const bulkPath = path.join(__dirname, '../next-crm/src/components/BulkStatusModal.tsx');
let bulk = fs.readFileSync(bulkPath, 'utf8');

// Ensure supabase is defined inside the component
if (!bulk.includes('const supabase = createClient();')) {
  bulk = bulk.replace(/export default function BulkStatusModal\(\{([^)]+)\}\) \{/, "export default function BulkStatusModal({$1}) {\n  const supabase = createClient();");
}
// Also ensure createClient is imported
if (!bulk.includes("import { createClient }")) {
  bulk = bulk.replace(/import \{ toast \} from 'sonner';/, "import { createClient } from '@/utils/supabase/client';\nimport { toast } from 'sonner';");
}
fs.writeFileSync(bulkPath, bulk);

const leadsClientPath = path.join(__dirname, '../next-crm/src/components/LeadsClient.tsx');
let leadsClient = fs.readFileSync(leadsClientPath, 'utf8');
// Fix the remaining LeadStatus errors
leadsClient = leadsClient.replace(/setFilterStatus\(([^)]+)\)/g, "setFilterStatus($1 as any)");
fs.writeFileSync(leadsClientPath, leadsClient);

console.log("Final TS fixes applied");
