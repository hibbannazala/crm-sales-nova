const fs = require('fs');
const path = require('path');

const srcLegacy = path.join(__dirname, '../src/components/AdminUsers.tsx');
const destClient = path.join(__dirname, '../next-crm/src/components/AdminUsersClient.tsx');
const destPage = path.join(__dirname, '../next-crm/src/app/admin/users/page.tsx');

let content = fs.readFileSync(srcLegacy, 'utf8');

// Add "use client" and Next.js imports
content = `"use client";\n` + content;
content = content.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';\n");
content = content.replace(/import \{ doc, updateDoc \} from 'firebase\/firestore';\n/, "");

// Replace Component Signature
content = content.replace(/export default function AdminUsers\(\{ users \}: AdminUsersProps\) \{/, "export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {\n  const [users, setUsers] = useState(initialUsers);\n  const supabase = createClient();\n  const router = useRouter();");

// Replace Mutators
content = content.replace(/await updateDoc\(doc\(db, "users", uid\), \{ role: 'staff' \}\);/g, "await supabase.from('users').update({ role: 'staff' }).eq('id', uid);\n      setUsers(users.map(u => u.id === uid ? { ...u, role: 'staff' } : u));\n      router.refresh();");
content = content.replace(/await updateDoc\(doc\(db, "users", uid\), \{ name: newName \}\);/g, "await supabase.from('users').update({ name: newName }).eq('id', uid);\n      setUsers(users.map(u => u.id === uid ? { ...u, name: newName } : u));\n      router.refresh();");
content = content.replace(/await updateDoc\(doc\(db, "users", uid\), \{ role: 'admin' \}\);/g, "await supabase.from('users').update({ role: 'admin' }).eq('id', uid);\n      setUsers(users.map(u => u.id === uid ? { ...u, role: 'admin' } : u));\n      router.refresh();");
content = content.replace(/await updateDoc\(doc\(db, "users", uid\), \{ role: 'pending' \}\);/g, "await supabase.from('users').update({ role: 'pending' }).eq('id', uid);\n      setUsers(users.map(u => u.id === uid ? { ...u, role: 'pending' } : u));\n      router.refresh();");

// Replace u.uid with u.id
content = content.replace(/u\.uid/g, "u.id");

fs.writeFileSync(destClient, content);

// Page.tsx
const pageContent = `import React from 'react';
import AdminUsersClient from '@/components/AdminUsersClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('role').eq('auth_id', session.user.id).single();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'lord')) {
    redirect('/dashboard');
  }

  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });

  return <AdminUsersClient initialUsers={users || []} />;
}
`;
fs.writeFileSync(destPage, pageContent);

console.log("Admin Users ported.");
