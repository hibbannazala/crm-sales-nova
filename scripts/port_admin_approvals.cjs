const fs = require('fs');
const path = require('path');

const srcLegacy = path.join(__dirname, '../src/components/AdminApprovals.tsx');
const destClient = path.join(__dirname, '../next-crm/src/components/AdminApprovalsClient.tsx');
const destPage = path.join(__dirname, '../next-crm/src/app/admin/approvals/page.tsx');

let content = fs.readFileSync(srcLegacy, 'utf8');

// Add "use client" and Next.js imports
content = `"use client";\n` + content;
content = content.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';\n");
content = content.replace(/import \{ doc, updateDoc, writeBatch \} from 'firebase\/firestore';\n/, "");

// Replace Component Signature
content = content.replace(/export default function AdminApprovals\(\{ approvals, leads \}: AdminApprovalsProps\) \{/, "export default function AdminApprovalsClient({ approvals }: { approvals: any[] }) {\n  const supabase = createClient();\n  const router = useRouter();");

// Replace Mutators
content = content.replace(/const pendingApprovals = approvals\.filter\(a => a\.status === 'pending'\);/, "const pendingApprovals = approvals.filter(a => a.status === 'pending');");

content = content.replace(/try \{\n      const lead = leads\.find\(l => l\.id === req\.leadId\);\n      if \(!lead\) throw new Error\("Lead tidak ditemukan"\);\n\n      const batch = writeBatch\(db\);\n      \n      const changes = \[\];\n      if \(req\.oldBrand !== req\.newBrand\) changes\.push\(`Brand: \$\{req\.oldBrand\} -> \$\{req\.newBrand\}`\);\n      if \(req\.oldContact !== req\.newContact\) changes\.push\(`WA: \$\{req\.oldContact\} -> \$\{req\.newContact\}`\);\n\n      const notes = \[\.\.\.\(lead\.notes \|\| \[\]\), \{\n        text: `\[SYSTEM\] Perubahan data disetujui Admin\. \$\{changes\.join\(', '\)\}`,\n        author: 'System',\n        timestamp: new Date\(\)\.toISOString\(\),\n        isLog: true\n      \}\];\n\n      batch\.update\(doc\(db, "leads", req\.leadId\), \{\n        brandName: req\.newBrand,\n        contact: req\.newContact,\n        notes: notes\n      \}\);\n      batch\.update\(doc\(db, "editRequests", req\.id\), \{\n        status: 'approved'\n      \}\);\n      await batch\.commit\(\);\n      toast\.success\("Perubahan disetujui"\);\n    \} catch \(error: any\)/, `try {
      const { data: lead } = await supabase.from('leads').select('notes').eq('id', req.leadId || req.lead_id).single();
      
      const changes = [];
      if (req.oldBrand !== req.newBrand) changes.push(\`Brand: \${req.oldBrand} -> \${req.newBrand}\`);
      if (req.oldContact !== req.newContact) changes.push(\`WA: \${req.oldContact} -> \${req.newContact}\`);

      const notes = [...(lead?.notes || []), {
        text: \`[SYSTEM] Perubahan data disetujui Admin. \${changes.join(', ')}\`,
        author: 'System',
        timestamp: new Date().toISOString(),
        isLog: true
      }];

      await supabase.from('leads').update({
        brand_name: req.newBrand,
        contact: req.newContact,
        notes: notes
      }).eq('id', req.leadId || req.lead_id);

      await supabase.from('edit_requests').update({
        status: 'approved'
      }).eq('id', req.id);

      toast.success("Perubahan disetujui");
      router.refresh();
    } catch (error: any)`);

content = content.replace(/await updateDoc\(doc\(db, "editRequests", id\), \{ status: 'rejected' \}\);/, "await supabase.from('edit_requests').update({ status: 'rejected' }).eq('id', id);\n      router.refresh();");

fs.writeFileSync(destClient, content);

// Page.tsx
const pageContent = `import React from 'react';
import AdminApprovalsClient from '@/components/AdminApprovalsClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'lord')) {
    redirect('/dashboard');
  }

  const { data: requests } = await supabase.from('edit_requests').select('*').order('timestamp', { ascending: false });

  const mapRequest = (r: any) => ({
    id: r.id,
    leadId: r.lead_id,
    requestedBy: r.requested_by,
    oldBrand: r.old_brand,
    newBrand: r.new_brand,
    oldContact: r.old_contact,
    newContact: r.new_contact,
    status: r.status,
    timestamp: r.timestamp
  });

  return <AdminApprovalsClient approvals={(requests || []).map(mapRequest)} />;
}
`;
fs.writeFileSync(destPage, pageContent);

console.log("Admin Approvals ported.");
