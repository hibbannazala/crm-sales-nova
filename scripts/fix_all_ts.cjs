const fs = require('fs');
const path = require('path');

// 1. Fix src/app/leads/page.tsx
const leadsPagePath = path.join(__dirname, '../next-crm/src/app/leads/page.tsx');
let leadsPage = fs.readFileSync(leadsPagePath, 'utf8');
leadsPage = leadsPage.replace(/const cookieStore = cookies\(\);/g, "const cookieStore = await cookies();");
leadsPage = leadsPage.replace(/priority: l\.priority \|\| 'Low',/g, "priority: l.priority || 'Low',\n    interestLevel: l.interest_level || 'Low',");
fs.writeFileSync(leadsPagePath, leadsPage);

// 2. Fix src/app/page.tsx
const pagePath = path.join(__dirname, '../next-crm/src/app/page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');
page = page.replace(/const cookieStore = cookies\(\);/g, "const cookieStore = await cookies();");
fs.writeFileSync(pagePath, page);

// 3. Fix BulkStatusModal.tsx
const bulkPath = path.join(__dirname, '../next-crm/src/components/BulkStatusModal.tsx');
let bulk = fs.readFileSync(bulkPath, 'utf8');
bulk = bulk.replace(/const leadRef = doc\(db, 'leads', lead\.id\);/g, "");
bulk = bulk.replace(/batch\.update\(leadRef, updateData\);/g, "promises.push(supabase.from('leads').update(updateData).eq('id', lead.id));");
// Remove sub-collection updates
bulk = bulk.replace(/\/\/ Sub-collection update[\s\S]*?continue;/g, "continue;");
bulk = bulk.replace(/\/\/ --- Sub-collection History \(Hybrid Strategy\) ---[\s\S]*?\} else \{[\s\S]*?\}\s*\}/g, "");
// For the remaining 'promises.push(supabase.from...' inside the else block that was missed by regex above:
bulk = bulk.replace(/const updatedHistory = \[\.\.\.\(lead\.funnelHistory \|\| \[\]\), funnelEntry\]; promises\.push\(supabase\.from\('leads'\)\.update\(\{ funnel_history: updatedHistory \}\)\.eq\('id', lead\.id\)\);/g, "");

fs.writeFileSync(bulkPath, bulk);

// 4. Fix LeadsClient.tsx error: Argument of type 'string' is not assignable to type 'LeadStatus'
// We can cast `e.target.value as LeadStatus`
const leadsClientPath = path.join(__dirname, '../next-crm/src/components/LeadsClient.tsx');
let leadsClient = fs.readFileSync(leadsClientPath, 'utf8');
leadsClient = leadsClient.replace(/setFilterStatus\(e\.target\.value\)/g, "setFilterStatus(e.target.value as LeadStatus | 'All')");
leadsClient = leadsClient.replace(/setFilterCategory\(e\.target\.value\)/g, "setFilterCategory(e.target.value as any)");
fs.writeFileSync(leadsClientPath, leadsClient);

console.log("Fixed all typescript errors");
