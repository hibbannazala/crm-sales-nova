const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '../src/components/LeadDetail.tsx');
const destFile = path.join(__dirname, '../next-crm/src/components/LeadDetailClient.tsx');

let code = fs.readFileSync(srcFile, 'utf8');

// 1. Change imports
code = code.replace(
  /import \{ db \} from '\.\.\/firebase';\nimport \{ collection, query, where, onSnapshot, orderBy, doc, updateDoc \} from 'firebase\/firestore';/,
  `import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';`
);

code = code.replace(
  /export default function LeadDetail\(\{ lead, user, users, onClose \}: LeadDetailProps\) \{/,
  `export default function LeadDetailClient({ lead: initialLead, user, users }: Omit<LeadDetailProps, 'onClose'>) {\n  const router = useRouter();\n  const onClose = () => router.push('/leads');\n  const [lead, setLead] = useState(initialLead);\n  const [notes, setNotes] = useState<Note[]>([]);\n  const supabase = createClient();`
);

// Remove the onSnapshot for Tasks and replace with supabase
code = code.replace(
  /const qTasks = query\(collection\(db, "tasks"\), where\("leadId", "==", lead\.id\)\);\s+const unsubTasks = onSnapshot\(qTasks, \(snapshot\) => \{\s+const taskData = snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\) as Task\[\];\s+taskData\.sort\(\(a, b\) => new Date\(b\.createdAt\)\.getTime\(\) - new Date\(a\.createdAt\)\.getTime\(\)\);\s+setTasks\(taskData\);\s+\}\);/,
  `const fetchTasks = async () => {\n      const { data } = await supabase.from('tasks').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });\n      if (data) {\n        setTasks(data.map(d => ({ ...d, leadId: d.lead_id, dueDate: d.due_date, assignedTo: d.assigned_to, assignedToName: d.assigned_to_name, assignedBy: d.assigned_by, createdAt: d.created_at, updatedAt: d.updated_at })));\n      }\n    };\n    fetchTasks();`
);

// Replace onSnapshot for History
code = code.replace(
  /const qHistory = query\(collection\(db, "leads", lead\.id, "history"\), orderBy\("timestamp", "desc"\)\);\s+const unsubHistory = onSnapshot\(qHistory, \(snapshot\) => \{\s+const historyData = snapshot\.docs\.map\(doc => \(\{ id: doc\.id, \.\.\.doc\.data\(\) \}\)\) as \(FunnelHistory & \{id: string\}\)\[\];\s+setFullHistory\(historyData\);\s+\}\);/,
  `const fetchHistory = async () => {\n      const { data } = await supabase.from('funnel_history').select('*').eq('lead_id', lead.id).order('timestamp', { ascending: false });\n      if (data) {\n        setFullHistory(data.map(d => ({ ...d, dealValue: d.deal_value, campaignNumber: d.campaign_number })));\n      }\n    };\n    fetchHistory();\n\n    const fetchNotes = async () => {\n      const { data } = await supabase.from('lead_notes').select('*').eq('lead_id', lead.id).order('timestamp', { ascending: false });\n      if (data) {\n        setNotes(data);\n      }\n    };\n    fetchNotes();`
);

// Remove the returned unsub calls
code = code.replace(
  /return \(\) => \{\s+unsubTasks\(\);\s+unsubHistory\(\);\s+\};/,
  `// Cleanup not needed for one-time fetch`
);

// Replace clearHistory function content
code = code.replace(
  /const clearHistory = async \(\) => \{[\s\S]*?toast\.success\("Histori berhasil dibersihkan"\);\s+\} catch \(error: any\) \{\s+toast\.error\("Gagal membersihkan histori: " \+ error\.message\);\s+\}\s+\}\s+\);\s+\};/,
  `const clearHistory = async () => {
    showConfirm(
      "Hapus Semua Histori", 
      "Apakah Anda yakin ingin menghapus semua catatan dan histori funnel? Tindakan ini tidak dapat dibatalkan.",
      async () => {
        try {
          await supabase.from('funnel_history').delete().eq('lead_id', lead.id);
          await supabase.from('oi_forecasts').delete().eq('lead_id', lead.id);
          await supabase.from('lead_notes').delete().eq('lead_id', lead.id);
          
          await supabase.from('leads').update({
            date_chated: null,
            date_responsed: null,
            date_set_meeting: null,
            date_closed: null,
            deal_value: 0,
            status: 'Leads'
          }).eq('id', lead.id);
          
          setLead(prev => ({...prev, dateChated: null, dateResponsed: null, dateSetMeeting: null, dateClosed: null, dealValue: 0, status: 'Leads'}));
          setFullHistory([]);
          setNotes([]);
          toast.success("Histori berhasil dibersihkan");
        } catch (error: any) {
          toast.error("Gagal membersihkan histori: " + error.message);
        }
      }
    );
  };`
);

// Replace deleteNote function content
code = code.replace(
  /const deleteNote = async \(originalNoteObj: any\) => \{[\s\S]*?toast\.success\("Catatan dihapus"\);\s+\}\s+\} catch \(error: any\) \{\s+toast\.error\("Gagal menghapus catatan: " \+ error\.message\);\s+\}\s+\};/,
  `const deleteNote = async (originalNoteObj: any) => {
    try {
      if (originalNoteObj.id) {
        await supabase.from('lead_notes').delete().eq('id', originalNoteObj.id);
        setNotes(prev => prev.filter(n => n.id !== originalNoteObj.id));
        toast.success("Catatan dihapus");
      }
    } catch (error: any) {
      toast.error("Gagal menghapus catatan: " + error.message);
    }
  };`
);

// Replace handleAddNote function
code = code.replace(
  /const handleAddNote = async \(\) => \{[\s\S]*?toast\.error\("Gagal menambah: " \+ err\.message\);\s+\} finally \{\s+setIsSendingNote\(false\);\s+\}\s+\};/,
  `const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setIsSendingNote(true);
    try {
      const newNote = {
        lead_id: lead.id,
        text: newNoteText,
        author: user.name,
        timestamp: new Date(newNoteDate).toISOString(),
        type: noteType
      };
      const { data, error } = await supabase.from('lead_notes').insert([newNote]).select();
      if (error) throw error;
      
      if (data && data.length > 0) {
        setNotes(prev => [data[0], ...prev]);
      }
      setNewNoteText('');
      toast.success(noteType === 'action_plan' ? "Action Plan ditambahkan" : "Catatan ditambahkan");
    } catch (err: any) {
      toast.error("Gagal menambah: " + err.message);
    } finally {
      setIsSendingNote(false);
    }
  };`
);

// Replace deleteHistoryItem
code = code.replace(
  /const deleteHistoryItem = async \(historyId: string, item: FunnelHistory\) => \{[\s\S]*?toast\.success\("Histori dihapus"\);\s+\} catch \(error: any\) \{\s+toast\.error\("Gagal menghapus: " \+ error\.message\);\s+\}\s+\};/,
  `const deleteHistoryItem = async (historyId: string, item: FunnelHistory) => {
    try {
      await supabase.from('funnel_history').delete().eq('id', historyId);

      if (item.stage === 'Close Win') {
        await supabase.from('oi_forecasts').delete().eq('lead_id', lead.id);
      }

      const updates: any = {};
      const remainingHistory = fullHistory.filter(h => (h as any).id !== historyId);
      const remainingOfStage = remainingHistory.filter(h => h.stage === item.stage);
      
      if (remainingOfStage.length === 0) {
        if (item.stage === 'Chated') updates.date_chated = null;
        else if (item.stage === 'Responsed') updates.date_responsed = null;
        else if (item.stage === 'Set Meeting') updates.date_set_meeting = null;
        else if (item.stage.includes('Close')) updates.date_closed = null;
      }

      if (remainingHistory.length > 0) {
        const sorted = [...remainingHistory].sort((a, b) => {
          const timeA = a.timestamp || new Date(a.date).getTime();
          const timeB = b.timestamp || new Date(b.date).getTime();
          return timeB - timeA;
        });
        const latest = sorted[0];
        updates.status = latest.stage;
        if (latest.stage !== 'Close Win') updates.deal_value = 0;
        else updates.deal_value = latest.dealValue || 0;
      } else {
        updates.status = 'Leads';
        updates.deal_value = 0;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('leads').update(updates).eq('id', lead.id);
        const camelUpdates: any = {};
        if (updates.date_chated !== undefined) camelUpdates.dateChated = updates.date_chated;
        if (updates.date_responsed !== undefined) camelUpdates.dateResponsed = updates.date_responsed;
        if (updates.date_set_meeting !== undefined) camelUpdates.dateSetMeeting = updates.date_set_meeting;
        if (updates.date_closed !== undefined) camelUpdates.dateClosed = updates.date_closed;
        if (updates.status !== undefined) camelUpdates.status = updates.status;
        if (updates.deal_value !== undefined) camelUpdates.dealValue = updates.deal_value;
        setLead(prev => ({ ...prev, ...camelUpdates }));
      }

      setFullHistory(remainingHistory);
      toast.success("Histori dihapus");
    } catch (error: any) {
      toast.error("Gagal menghapus: " + error.message);
    }
  };`
);

// Replace saveHistoryEdit
code = code.replace(
  /const saveHistoryEdit = async \(\) => \{[\s\S]*?toast\.error\("Gagal update history: " \+ error\.message\);\s+\}\s+\};/,
  `const saveHistoryEdit = async () => {
    if (!editingHistoryId || !editHistoryData) return;
    try {
      await supabase.from('funnel_history').update({
        stage: editHistoryData.stage,
        date: editHistoryData.date,
        by: editHistoryData.by,
        deal_value: editHistoryData.dealValue,
        campaign_number: editHistoryData.campaignNumber
      }).eq('id', editingHistoryId);
      
      const isLatest = fullHistory[0]?.id === editingHistoryId;
      const updatedArray = fullHistory.map(h => {
        if ((h as any).id === editingHistoryId) {
          return { ...h, ...editHistoryData };
        }
        return h;
      });
      
      if (isLatest) {
        await supabase.from('leads').update({
          status: editHistoryData.stage,
          deal_value: editHistoryData.stage === 'Close Win' ? editHistoryData.dealValue : lead.dealValue
        }).eq('id', lead.id);
        
        setLead(prev => ({
          ...prev, 
          status: editHistoryData.stage as any, 
          dealValue: editHistoryData.stage === 'Close Win' ? editHistoryData.dealValue : lead.dealValue
        }));
      }

      setFullHistory(updatedArray);
      toast.success("Histori diperbarui");
      setEditingHistoryId(null);
    } catch (error: any) {
      toast.error("Gagal update history: " + error.message);
    }
  };`
);

// Search for `lead.notes` mapping in UI and replace it with `notes`
code = code.replaceAll('lead.notes?.length', 'notes.length');
code = code.replaceAll('lead.notes', 'notes');

// Search for `lead.funnelHistory` mapping in UI and replace it with `fullHistory`
// Wait, the UI uses `(fullHistory.length > 0 ? fullHistory : (lead.funnelHistory || []))`
code = code.replaceAll('(fullHistory.length > 0 ? fullHistory : (lead.funnelHistory || []))', 'fullHistory');
code = code.replaceAll('lead.funnelHistory', 'fullHistory');

// StatusModal mapping
code = code.replace(
  /<StatusModal\s*isOpen=\{isStatusModalOpen\}\s*onClose=\{\(\) => setIsStatusModalOpen\(false\)\}\s*lead=\{lead\}\s*user=\{user\}\s*\/>/g,
  `<StatusModalClient isOpen={isStatusModalOpen} onClose={() => { setIsStatusModalOpen(false); /* Fetch latest on close if needed */ }} lead={lead} user={user} users={users} />`
);

// Write output
fs.writeFileSync(destFile, code);
console.log('Done!');
