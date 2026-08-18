const fs = require('fs');
const path = require('path');

// 1. Fix src/app/tasks/page.tsx
const pagePath = path.join(__dirname, '../next-crm/src/app/tasks/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace(/const cookieStore = await cookies\(\);\n  const supabase = createClient\(cookieStore\);/, "const supabase = await createClient();");
// Fix await createClient() missing await in subsequent lines
pageContent = pageContent.replace(/await supabase\.auth/g, "(await supabase).auth");
pageContent = pageContent.replace(/await supabase\.from/g, "(await supabase).from");
fs.writeFileSync(pagePath, pageContent);

// 2. Copy ConfirmModal.tsx
const srcLegacyConfirmModal = path.join(__dirname, '../src/components/ConfirmModal.tsx');
const destConfirmModal = path.join(__dirname, '../next-crm/src/components/ConfirmModal.tsx');
let confirmModalContent = fs.readFileSync(srcLegacyConfirmModal, 'utf8');
confirmModalContent = `"use client";\n` + confirmModalContent;
fs.writeFileSync(destConfirmModal, confirmModalContent);

// 3. Fix TaskModal.tsx
const srcLegacyTaskModal = path.join(__dirname, '../src/components/TaskModal.tsx');
const destTaskModal = path.join(__dirname, '../next-crm/src/components/TaskModal.tsx');
let taskModalContent = fs.readFileSync(srcLegacyTaskModal, 'utf8');
taskModalContent = `"use client";\n` + taskModalContent;
taskModalContent = taskModalContent.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';\n");
taskModalContent = taskModalContent.replace(/import \{ collection, addDoc, updateDoc, doc, Timestamp \} from 'firebase\/firestore';\n/, "");
taskModalContent = taskModalContent.replace(/export default function TaskModal\(\{([^)]+)\}\) \{/, "export default function TaskModal({$1}) {\n  const supabase = createClient();\n  const router = useRouter();");

taskModalContent = taskModalContent.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?\} catch \(error\) \{/g, `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
        taskData.created_by = user.id || user.email; // Fallback
        taskData.created_at = new Date().toISOString();
        const { data, error } = await supabase.from('tasks').insert([taskData]).select();
        if (error) throw error;
        toast.success("Task created successfully");
      }
      
      router.refresh();
      onClose();
    } catch (error) {`);

taskModalContent = taskModalContent.replace(/const q = query\(collection\(db, 'leads'\), orderBy\('name'\)\);[\s\S]*?\} catch/, `const { data } = await supabase.from('leads').select('id, name').order('name');
        if (data) setLeads(data as any);
      } catch`);
fs.writeFileSync(destTaskModal, taskModalContent);

// 4. Fix TasksClient.tsx
const destTasksClient = path.join(__dirname, '../next-crm/src/components/TasksClient.tsx');
let tasksContent = fs.readFileSync(destTasksClient, 'utf8');
tasksContent = tasksContent.replace(/const navigate = useNavigate\(\);\n/, "");
tasksContent = tasksContent.replace(/navigate\('\/leads'\)/g, "router.push('/leads')");
fs.writeFileSync(destTasksClient, tasksContent);

console.log("Fixes applied.");
