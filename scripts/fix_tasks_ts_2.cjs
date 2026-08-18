const fs = require('fs');
const path = require('path');

// 1. Fix src/app/tasks/page.tsx
const pagePath = path.join(__dirname, '../next-crm/src/app/tasks/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace(/const supabase = await createClient\(\);/g, "const supabaseClient = await createClient();");
pageContent = pageContent.replace(/\(await supabase\)\.auth/g, "supabaseClient.auth");
pageContent = pageContent.replace(/\(await supabase\)\.from/g, "supabaseClient.from");
fs.writeFileSync(pagePath, pageContent);

// 2. Fix TaskModal.tsx
const taskModalPath = path.join(__dirname, '../next-crm/src/components/TaskModal.tsx');
let taskModalContent = fs.readFileSync(taskModalPath, 'utf8');
taskModalContent = taskModalContent.replace(/user\.id/g, "user.uid");
if (!taskModalContent.includes("const router = useRouter();")) {
    taskModalContent = taskModalContent.replace(/const \[leads, setLeads\] = useState<Lead\[\]>\(\[\]\);/, "const router = useRouter();\n  const [leads, setLeads] = useState<Lead[]>([]);");
}
fs.writeFileSync(taskModalPath, taskModalContent);

// 3. Fix TasksClient.tsx
const tasksClientPath = path.join(__dirname, '../next-crm/src/components/TasksClient.tsx');
let tasksContent = fs.readFileSync(tasksClientPath, 'utf8');
tasksContent = tasksContent.replace(/navigate\('\/leads'\)/g, "router.push('/leads')");
fs.writeFileSync(tasksClientPath, tasksContent);

console.log("Fixes applied.");
