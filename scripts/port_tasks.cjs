const fs = require('fs');
const path = require('path');

const srcLegacyTasks = path.join(__dirname, '../src/components/Tasks.tsx');
const srcLegacyTaskModal = path.join(__dirname, '../src/components/TaskModal.tsx');
const destTasksClient = path.join(__dirname, '../next-crm/src/components/TasksClient.tsx');
const destTaskModal = path.join(__dirname, '../next-crm/src/components/TaskModal.tsx');
const destPage = path.join(__dirname, '../next-crm/src/app/tasks/page.tsx');

// 1. Copy TaskModal.tsx
let taskModalContent = fs.readFileSync(srcLegacyTaskModal, 'utf8');
taskModalContent = `"use client";\n` + taskModalContent;
// Replace firebase imports in TaskModal
taskModalContent = taskModalContent.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\n");
taskModalContent = taskModalContent.replace(/import \{ collection, addDoc, updateDoc, doc, Timestamp \} from 'firebase\/firestore';\n/, "");
taskModalContent = taskModalContent.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\} catch \(error\)/, `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const taskData: any = {
        title,
        description,
        due_date: new Date(dueDate).toISOString(),
        priority,
        status: 'Todo',
        assigned_to: assignedTo,
        lead_id: leadId || null,
        updated_at: new Date().toISOString()
      };

      if (task) {
        await supabase.from('tasks').update(taskData).eq('id', task.id);
        toast.success("Task updated successfully");
      } else {
        taskData.created_by = user.id;
        taskData.created_at = new Date().toISOString();
        const { data } = await supabase.from('tasks').insert([taskData]).select();
      }
      onClose();
    } catch (error)`);
// Wait, TaskModal doesn't need to refresh if we pass `onSuccess` or something.
// Oh wait, `TasksClient` was using `onSnapshot`. If we use server fetch, we need to refresh!
// We'll add `import { useRouter } from 'next/navigation';` in `TasksClient`.
fs.writeFileSync(destTaskModal, taskModalContent);


// 2. TasksClient.tsx
let tasksContent = fs.readFileSync(srcLegacyTasks, 'utf8');
tasksContent = `"use client";\n` + tasksContent;
tasksContent = tasksContent.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';\n");
tasksContent = tasksContent.replace(/import \{ collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, deleteDoc, Timestamp, getDocs \} from 'firebase\/firestore';\n/, "");
tasksContent = tasksContent.replace(/import \{ useNavigate \} from 'react-router-dom';\n/, "");
tasksContent = tasksContent.replace(/export default function Tasks\(\{ user, users \}: TasksProps\) \{/, "export default function TasksClient({ initialTasks, user, users, leads }: any) {");
tasksContent = tasksContent.replace(/const navigate = useNavigate\(\);/, "const router = useRouter();\n  const supabase = createClient();");
// Change state:
tasksContent = tasksContent.replace(/const \[tasks, setTasks\] = useState<Task\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);/, `const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [loading, setLoading] = useState(false);`);

// Remove useEffect onSnapshot
tasksContent = tasksContent.replace(/useEffect\(\(\) => \{[\s\S]*?return unsubscribe;\n  \}, \[\]\);/, `useEffect(() => { setTasks(initialTasks); }, [initialTasks]);`);

// Update toggle status
tasksContent = tasksContent.replace(/await updateDoc\(doc\(db, 'tasks', task\.id\), \{ status: nextStatus \}\);/, `await supabase.from('tasks').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', task.id);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
      router.refresh();`);

// Delete task
tasksContent = tasksContent.replace(/await deleteDoc\(doc\(db, 'tasks', id\)\);/, `await supabase.from('tasks').delete().eq('id', id);
          setTasks(tasks.filter(t => t.id !== id));
          router.refresh();`);

// Rename `Tasks` to `TasksClient`
tasksContent = tasksContent.replace(/export default function Tasks\(/, "export default function TasksClient(");
fs.writeFileSync(destTasksClient, tasksContent);

// 3. tasks/page.tsx
const pageContent = `import React from 'react';
import TasksClient from '@/components/TasksClient';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TasksPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: userData } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
  if (!userData) redirect('/login');

  // Fetch tasks
  const { data: tasksData } = await supabase.from('tasks').select('*, users!tasks_assigned_to_fkey(name), leads(name)').order('created_at', { ascending: false });
  const { data: allUsers } = await supabase.from('users').select('*');
  const { data: allLeads } = await supabase.from('leads').select('id, name');

  // Map tasks
  const mappedTasks = tasksData?.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    assignedToName: t.users?.name || 'Unknown',
    leadName: t.leads?.name || ''
  })) || [];

  return <TasksClient initialTasks={mappedTasks} user={userData} users={allUsers} leads={allLeads} />;
}
`;
fs.writeFileSync(destPage, pageContent);

console.log("Tasks porting script completed.");
