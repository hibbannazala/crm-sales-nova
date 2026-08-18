const fs = require('fs');
const path = require('path');

const srcLegacy = path.join(__dirname, '../src/components/AdminTargets.tsx');
const destClient = path.join(__dirname, '../next-crm/src/components/AdminTargetsClient.tsx');
const destPage = path.join(__dirname, '../next-crm/src/app/admin/targets/page.tsx');

let content = fs.readFileSync(srcLegacy, 'utf8');

// Add "use client" and Next.js imports
content = `"use client";\n` + content;
content = content.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';\n");
content = content.replace(/import \{ doc, setDoc \} from 'firebase\/firestore';\n/, "");

// Replace Component Signature
content = content.replace(/export default function AdminTargets\(\{ targets, individualTargets = \[\], auditLogs = \[\], users = \[\], user \}: AdminTargetsProps\) \{/, "export default function AdminTargetsClient({ targets, individualTargets = [], auditLogs = [], users = [], user }: AdminTargetsProps) {\n  const supabase = createClient();\n  const router = useRouter();");

// Replace Mutators
content = content.replace(/const targetRef = doc\(db, "globalTargets", selectedMonth\);\n[\s\S]*?toast\.success\("Target global berhasil disimpan"\);/g, `const payload = {
          id: selectedMonth,
          month_year: selectedMonth,
          target_chat: Number(formData.targetChat),
          target_meeting: Number(formData.targetMeeting),
          target_revenue: Number(formData.targetRevenue),
          updated_at: new Date().toISOString(),
          updated_by: user.name
        };
        await supabase.from('global_targets').upsert(payload);
        toast.success("Target global berhasil disimpan");
        router.refresh();`);

content = content.replace(/const targetId = `\$\{selectedMonth\}_\$\{targetUser\}`;\n[\s\S]*?toast\.success\(`Target untuk \$\{selectedUserName\} berhasil disimpan`\);/g, `const targetId = \`\${selectedMonth}_\${targetUser}\`;
        const selectedUserName = users.find(u => u.uid === targetUser)?.name || 'Unknown';
        
        const payload = {
          id: targetId,
          user_id: targetUser,
          user_name: selectedUserName,
          month_year: selectedMonth,
          target_chat: Number(formData.targetChat),
          target_meeting: Number(formData.targetMeeting),
          target_revenue: Number(formData.targetRevenue),
          updated_at: new Date().toISOString(),
          updated_by: user.name
        };
        await supabase.from('oi_targets').upsert(payload);
        toast.success(\`Target untuk \${selectedUserName} berhasil disimpan\`);
        router.refresh();`);

content = content.replace(/u\.uid === targetUser/g, "(u.uid || u.id) === targetUser");
content = content.replace(/<span className="font-bold text-slate-800">\{u.name\}<\/span>/g, `<span className="font-bold text-slate-800">{u.name}</span>`);
content = content.replace(/value=\{u\.uid\}/g, "value={u.id || u.uid}");
content = content.replace(/key=\{u\.uid\}/g, "key={u.id || u.uid}");

fs.writeFileSync(destClient, content);

// Page.tsx
const pageContent = `import React from 'react';
import AdminTargetsClient from '@/components/AdminTargetsClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function TargetsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'lord')) {
    redirect('/dashboard');
  }

  const { data: globalTargetsData } = await supabase.from('global_targets').select('*');
  const { data: individualTargetsData } = await supabase.from('oi_targets').select('*');
  const { data: users } = await supabase.from('users').select('*').neq('role', 'pending').neq('role', 'lord');

  const mapTarget = (t: any) => ({
    id: t.id,
    monthYear: t.month_year,
    targetChat: t.target_chat,
    targetMeeting: t.target_meeting,
    targetRevenue: t.target_revenue,
    updatedAt: t.updated_at,
    updatedBy: t.updated_by,
    userId: t.user_id,
    userName: t.user_name
  });

  return (
    <AdminTargetsClient 
      targets={(globalTargetsData || []).map(mapTarget)}
      individualTargets={(individualTargetsData || []).map(mapTarget)}
      users={users || []}
      user={currentUser as any}
      auditLogs={[]}
    />
  );
}
`;
fs.writeFileSync(destPage, pageContent);

console.log("Admin Targets ported.");
