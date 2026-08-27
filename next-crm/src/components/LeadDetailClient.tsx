"use client";
import React, { useState, useEffect } from 'react';
import { Lead, UserProfile, Task, Note, FunnelHistory } from '../types';
import { 
  X, Calendar, Phone, Database, MessageSquare, 
  History, CheckCircle2, Clock, AlertCircle, 
  TrendingUp, User, Tag, ArrowLeft, Plus,
  ExternalLink, Mail, MapPin, Globe, Bolt, Trash2, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import MarkdownRenderer from './MarkdownRenderer';
import MarkdownEditor from './MarkdownEditor';
import ConfirmModal from './ConfirmModal';
import TaskModal from './TaskModal';
import StatusModalClient from './StatusModalClient';
import CurrencyInput from './common/CurrencyInput';

interface LeadDetailProps {
  lead: Lead;
  user: UserProfile;
  users: UserProfile[];
  onClose: () => void;
}

export default function LeadDetailClient({ lead: initialLead, user, users }: Omit<LeadDetailProps, 'onClose'>) {
  const router = useRouter();
  const onClose = () => router.push('/leads');
  const [lead, setLead] = useState(initialLead);
  const [notes, setNotes] = useState<Note[]>([]);
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fullHistory, setFullHistory] = useState<FunnelHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'history' | 'tasks'>('overview');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editHistoryData, setEditHistoryData] = useState<{stage: string, date: string, by: string, dealValue?: number, campaignNumber?: number} | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteDate, setNewNoteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noteType, setNoteType] = useState<'note' | 'action_plan'>('note');
  const [isSendingNote, setIsSendingNote] = useState(false);

  const STAGES = ["Input Data", "Leads", "Chated", "Responsed", "Set Meeting", "Hold", "Close Win", "Close Lost", "Failed"];
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    if (!lead.id) return;

    // Fetch Tasks
    const fetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
      if (data) {
        setTasks(data.map(d => ({ ...d, leadId: d.lead_id, dueDate: d.due_date, assignedTo: d.assigned_to, assignedToName: d.assigned_to_name, assignedBy: d.assigned_by, createdAt: d.created_at, updatedAt: d.updated_at })));
      }
    };
    fetchTasks();

    // Fetch Sub-collection History
    const fetchHistory = async () => {
      const { data, error } = await supabase.from('funnel_history').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
      if (error) console.error("Error fetching history:", error);
      if (data) {
        setFullHistory(data.map(d => ({ 
          ...d, 
          id: d.id,
          stage: d.stage,
          date: d.date_occurred ? d.date_occurred.split('T')[0] : '',
          by: d.by_user_name,
          assignedBy: d.assigned_by,
          note: d.note,
          timestamp: d.created_at ? new Date(d.created_at).getTime() : 0,
          dealValue: d.deal_value, 
          campaignNumber: d.campaign_number 
        })));
      }
    };
    fetchHistory();

    const fetchNotes = async () => {
      const { data, error } = await supabase.from('lead_notes').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
      if (error) console.error("Error fetching notes:", error);
      if (data) {
        setNotes(data.map(d => ({
          ...d,
          author: d.author_name,
          timestamp: d.created_at,
          type: d.note_type,
          isLog: d.is_log
        })));
      }
    };
    fetchNotes();

    // Cleanup not needed for one-time fetch
  }, [lead.id]);

  const clearHistory = async () => {
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
          
          setLead(prev => ({...prev, dateChated: undefined, dateResponsed: undefined, dateSetMeeting: undefined, dateClosed: undefined, dealValue: 0, status: 'Leads'}));
          setFullHistory([]);
          setNotes([]);
          toast.success("Histori berhasil dibersihkan");
        } catch (error: any) {
          toast.error("Gagal membersihkan histori: " + error.message);
        }
      }
    );
  };

  const deleteNote = async (originalNoteObj: any) => {
    try {
      if (originalNoteObj.id) {
        await supabase.from('lead_notes').delete().eq('id', originalNoteObj.id);
        setNotes(prev => prev.filter(n => n.id !== originalNoteObj.id));
        toast.success("Catatan dihapus");
      }
    } catch (error: any) {
      toast.error("Gagal menghapus catatan: " + error.message);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setIsSendingNote(true);
    try {
      const newNote = {
        id: crypto.randomUUID(),
        lead_id: lead.id,
        text: newNoteText,
        author_name: user.name,
        created_at: new Date(newNoteDate).toISOString(),
        note_type: noteType
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
  };

  const deleteHistoryItem = async (historyId: string, item: FunnelHistory) => {
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
  };

  const saveHistoryEdit = async () => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chated': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Responsed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Set Meeting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Close Win': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Close Lost': return 'bg-red-100 text-red-700 border-red-200';
      case 'Failed': return 'bg-gray-200 text-gray-700 border-gray-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'HOT': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'WARM': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'COLD': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="h-20 border-b border-slate-100 flex items-center justify-between px-8 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-xl transition shadow-sm border border-transparent hover:border-slate-200 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{lead.brandName}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                getStatusColor(lead.status)
              )}>
                {lead.status}
              </span>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                getInterestColor(lead.interestLevel)
              )}>
                {lead.interestLevel}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lead ID: {lead.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href={`https://wa.me/${lead.contact.replace(/^0/, '62')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition"
          >
            <Phone className="w-4 h-4" /> Hubungi WhatsApp
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Info */}
        <aside className="w-80 border-r border-slate-100 p-8 overflow-y-auto bg-slate-50/30">
          <section className="space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Informasi Utama</h3>
              <div className="space-y-4">
                <InfoItem icon={<Tag className="w-4 h-4" />} label="Kategori" value={lead.category} />
                {lead.leadSource && <InfoItem icon={<Globe className="w-4 h-4" />} label="Sumber Online" value={lead.leadSource} />}
                <InfoItem icon={<Database className="w-4 h-4" />} label="Tgl Input" value={new Date(lead.dateInput).toLocaleDateString('id-ID', { dateStyle: 'long' })} />
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Kontak" value={lead.contact} />
                {lead.email && <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={lead.email} />}
              </div>
            </div>

            {lead.productOffered && lead.productOffered.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Produk Ditawarkan</h3>
                <div className="flex items-center gap-2">
                  {lead.productOffered.map(p => (
                    <span key={p} className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border",
                      p === 'TNT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                      p === 'Basemen' ? 'bg-slate-100 text-slate-700 border-slate-200' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    )}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setIsStatusModalOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition text-sm font-bold text-slate-600"
                >
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Update Status
                </button>
                <button 
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition text-sm font-bold text-slate-600"
                >
                  <Plus className="w-4 h-4 text-emerald-500" /> Tambah Task
                </button>
                {user.role === 'lord' && (
                  <button 
                    onClick={clearHistory}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 hover:shadow-sm border border-transparent hover:border-red-200 transition text-sm font-bold text-red-600"
                  >
                    <Trash2 className="w-4 h-4" /> Clear History
                  </button>
                )}
              </div>
            </div>
          </section>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="px-8 border-b border-slate-100 flex items-center gap-8 shrink-0">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
            <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} label={`Notes (${notes.length || 0})`} />
            <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="Funnel History" />
            <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label={`Tasks (${tasks.length})`} />
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-3 gap-6">
                    <StatCard label="Total Notes" value={notes.length || 0} icon={<MessageSquare className="w-5 h-5 text-amber-500" />} />
                    <StatCard label="Funnel Steps" value={fullHistory.length || 0} icon={<History className="w-5 h-5 text-indigo-500" />} />
                    <StatCard label="Pending Tasks" value={tasks.filter(t => t.status !== 'Done').length} icon={<Clock className="w-5 h-5 text-rose-500" />} />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-500" /> Funnel Milestones
                      </h3>
                      <div className="space-y-4">
                        {(() => {
                          const history = fullHistory.length > 0 ? fullHistory : (fullHistory || []);
                          const getStageData = (stagePattern: string) => {
                            const matches = history.filter(h => h.stage.includes(stagePattern));
                            if (matches.length === 0) return undefined;
                            return matches.sort((a, b) => {
                              const timeA = a.timestamp || new Date(a.date).getTime();
                              const timeB = b.timestamp || new Date(b.date).getTime();
                              return timeB - timeA; // Descending, newest first
                            })[0];
                          };

                          const chatedData = getStageData('Chated');
                          const responsedData = getStageData('Responsed');
                          const meetingData = getStageData('Set Meeting');
                          const closedData = getStageData('Close');
                          
                          // History is sorted desc, so input author is at the END or we check the earliest
                          const sortedHistoryAsc = [...history].sort((a, b) => {
                            const timeA = a.timestamp || new Date(a.date).getTime();
                            const timeB = b.timestamp || new Date(b.date).getTime();
                            return timeA - timeB; // Ascending, oldest first
                          });
                          const earliest = sortedHistoryAsc[0];
                          const inputAuthor = earliest ? earliest.by : 'Sistem';

                          return (
                            <>
                              <MilestoneItem label="Input Data" date={lead.dateInput} active={true} by={inputAuthor} />
                              <MilestoneItem label="Chated" date={chatedData?.date} active={!!chatedData} by={chatedData?.by} />
                              <MilestoneItem label="Responsed" date={responsedData?.date} active={!!responsedData} by={responsedData?.by} />
                              <MilestoneItem label="Set Meeting" date={meetingData?.date} active={!!meetingData} by={meetingData?.by} />
                              <MilestoneItem 
                                label="Closed" 
                                date={closedData?.date} 
                                active={!!closedData && (lead.status === 'Close Win' || lead.status === 'Close Lost')} 
                                by={closedData?.by} 
                              />
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Upcoming Tasks
                        </h3>
                        <button 
                          onClick={() => setIsTaskModalOpen(true)}
                          className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors uppercase tracking-widest"
                        >
                          + New
                        </button>
                      </div>
                      <div className="space-y-4">
                        {tasks.filter(t => t.status !== 'Done').slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                              )}></div>
                              <span className="text-sm font-bold text-slate-700">{task.title}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{task.dueDate}</span>
                          </div>
                        ))}
                        {tasks.filter(t => t.status !== 'Done').length === 0 && (
                          <p className="text-sm text-slate-400 italic text-center py-4">Tidak ada task pending.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notes' && (() => {
                let actionPlanCounter = 0;
                const allNotes = [...(notes || [])];
                
                // Inject legacy action plan as the very first note if it exists
                if (lead.actionPlan && !allNotes.some(n => (n as any).isLegacyActionPlan)) {
                  allNotes.unshift({
                    text: lead.actionPlan,
                    author: fullHistory[0]?.by || 'Sistem (Awal)',
                    timestamp: lead.dateInput + "T00:00:00Z",
                    type: 'action_plan',
                    isLegacyActionPlan: true
                  } as any);
                }

                // Map sequential numbering for Action Plans
                const processedNotes = allNotes.map(n => {
                  if (n.type === 'action_plan') {
                    actionPlanCounter++;
                    return { ...n, planIndex: actionPlanCounter };
                  }
                  return n;
                }).reverse();

                return (
                  <motion.div 
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex-1 space-y-6 overflow-y-auto mb-6 pr-2">
                      {processedNotes.length > 0 ? (
                        processedNotes.map((note: any, i) => {
                          const isActionPlan = note.type === 'action_plan';
                          return (
                            <div key={i} className={cn(
                              "p-6 rounded-3xl border transition-all relative group",
                              note.isLog ? "bg-slate-50 border-slate-100" : 
                              isActionPlan ? "bg-indigo-50/50 border-indigo-100" : "bg-white border-slate-100 shadow-sm"
                            )}>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {isActionPlan ? (
                                    <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-500/20">
                                      <TrendingUp className="w-3 h-3" /> Action Plan Ke-{note.planIndex}
                                    </div>
                                  ) : (
                                    <div className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                                      <MessageSquare className="w-3 h-3" /> Catatan Umum
                                    </div>
                                  )}
                                  <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" /> {note.author}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(note.timestamp).toLocaleString('id-ID')}</span>
                                  {!note.isLegacyActionPlan && user.role === 'lord' && (
                                    <button 
                                      onClick={() => showConfirm("Hapus Catatan", "Hapus catatan ini?", () => deleteNote(note))}
                                      className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className={cn(
                                "text-sm leading-relaxed mt-2",
                                note.isLog ? "text-slate-500 italic" : 
                                isActionPlan ? "text-indigo-900 font-medium" : "text-slate-700 font-medium"
                              )}>
                                <MarkdownRenderer content={note.text} />
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-20">
                          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada action plan atau catatan.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* INPUT AREA */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm shrink-0">
                      <div className="flex items-center gap-3 mb-3">
                        <input 
                          type="date"
                          value={newNoteDate}
                          onChange={e => setNewNoteDate(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        <button
                          onClick={() => setNoteType('note')}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            noteType === 'note' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          + Add Note
                        </button>
                        <button
                          onClick={() => setNoteType('action_plan')}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            noteType === 'action_plan' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )}
                        >
                          + Add Action Plan
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <MarkdownEditor
                            value={newNoteText}
                            onChange={setNewNoteText}
                            placeholder={noteType === 'action_plan' ? "Ketik langkah action plan selanjutnya..." : "Ketik catatan diskusi/informasi..."}
                            disabled={isSendingNote}
                          />
                        </div>
                        <button
                          onClick={handleAddNote}
                          disabled={!newNoteText.trim() || isSendingNote}
                          className="px-6 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {activeTab === 'history' && (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100"
                >
                  {fullHistory.map((h: any, i) => {
                    const historyId = h.id;
                    const isInputData = h.stage === 'Input Data';
                    const canManage = user.role === 'lord' || user.role === 'admin' || h.by === user.name;
                    
                    return (
                    <div key={historyId} className="relative group">
                      <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-white border-4 border-indigo-500 z-10 shadow-sm"></div>
                      
                      {editingHistoryId === historyId ? (
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-200 shadow-inner space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Status Funnel</label>
                               <select 
                                 value={editHistoryData?.stage}
                                 onChange={e => setEditHistoryData(prev => ({...prev!, stage: e.target.value}))}
                                 className="w-full text-sm font-bold bg-white border border-slate-200 p-2 rounded-lg"
                               >
                                 {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Tanggal</label>
                               <input 
                                 type="date" 
                                 value={editHistoryData?.date || ''}
                                 onChange={e => setEditHistoryData(prev => ({...prev!, date: e.target.value}))}
                                 className="w-full text-sm font-bold bg-white border border-slate-200 p-2 rounded-lg"
                               />
                            </div>
                          </div>
                          <div>
                             <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Injeksi PIC / Author</label>
                             <input 
                               type="text" 
                               value={editHistoryData?.by || ''}
                               onChange={e => setEditHistoryData(prev => ({...prev!, by: e.target.value}))}
                               className="w-full text-sm font-bold bg-white border border-slate-200 p-2 rounded-lg"
                               placeholder="Nama PIC (Misal: Jeff)"
                             />
                           </div>
                           {editHistoryData?.stage === 'Close Win' && (
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <label className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">Nominal Deal Value</label>
                                  <CurrencyInput 
                                    value={editHistoryData?.dealValue || 0}
                                    onChange={val => setEditHistoryData(prev => ({...prev!, dealValue: val}))}
                                    className="w-full text-sm font-bold bg-white border border-emerald-200 p-2 rounded-lg"
                                  />
                               </div>
                               <div>
                                  <label className="text-[10px] uppercase font-bold text-indigo-600 block mb-1">Campaign Keberapa</label>
                                  <input 
                                    type="number" 
                                    value={editHistoryData?.campaignNumber || ''}
                                    onChange={e => setEditHistoryData(prev => ({...prev!, campaignNumber: Number(e.target.value)}))}
                                    className="w-full text-sm font-bold bg-white border border-indigo-200 p-2 rounded-lg"
                                  />
                               </div>
                             </div>
                           )}
                          <div className="flex justify-end gap-2 pt-2">
                             <button onClick={() => setEditingHistoryId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition">Batal</button>
                             <button onClick={saveHistoryEdit} className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition">Terapkan Perubahan</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-black text-slate-900 tracking-tight">{h.stage}</h4>
                              {canManage && historyId && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingHistoryId(historyId);
                                      setEditHistoryData({ stage: h.stage, date: h.date, by: h.by, dealValue: h.dealValue, campaignNumber: h.campaignNumber });
                                    }}
                                    className="p-1.5 hover:bg-indigo-50 text-slate-300 hover:text-indigo-500 rounded-lg transition-colors"
                                    title="Edit Siluman"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                  </button>
                                  {!isInputData && (
                                    <button 
                                      onClick={() => showConfirm("Hapus Histori", "Hapus tahapan funnel ini secara permanen?", () => deleteHistoryItem(historyId, h))}
                                      className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                      title="Hapus Permanen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.date}</span>
                          </div>
                          
                          {h.stage === 'Close Win' && (h.campaignNumber || h.dealValue) && (
                            <div className="mb-3 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                              <span className="text-xs font-black text-indigo-700">📌 Campaign Ke-{h.campaignNumber || 1}</span>
                              <span className="text-sm font-black text-emerald-600">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h.dealValue || 0)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">Diperbarui oleh <span className="text-indigo-600">{h.by}</span>
                            {(h.assignedBy && h.assignedBy !== 'System') && <span className="text-purple-500 text-xs"> (assigned by {h.assignedBy})</span>}
                          </div>
                          {h.note && (
                            <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                                <MessageSquare className="w-3 h-3" /> Catatan:
                              </p>
                              <p className="text-sm font-medium text-slate-700">{h.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )})}
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div 
                  key="tasks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Lead Tasks</h4>
                    <button 
                      onClick={() => setIsTaskModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Create Task
                    </button>
                  </div>
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div key={task.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            task.status === 'Done' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                          )}>
                            {task.status === 'Done' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className={cn(
                              "text-base font-black tracking-tight",
                              task.status === 'Done' ? "text-slate-400 line-through" : "text-slate-900"
                            )}>{task.title}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {task.dueDate}
                              </span>
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                task.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                              )}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</p>
                            <p className="text-xs font-bold text-slate-700">{task.assignedToName}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada task untuk lead ini.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        user={user}
        users={users}
        editingTask={null}
        initialLeadId={lead.id}
        initialLeadName={lead.brandName}
      />

      <StatusModalClient
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        lead={lead}
        user={user}
        users={users}
      />

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </motion.div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "h-16 flex items-center px-2 relative text-sm font-black uppercase tracking-widest transition-all",
        active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"
        />
      )}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function MilestoneItem({ label, date, active, by }: { label: string, date?: string, active: boolean, by?: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl border border-transparent transition-all">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
          active ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-300"
        )}>
          {active ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "text-sm font-bold",
            active ? "text-slate-700" : "text-slate-400"
          )}>{label}</span>
          {active && by && (
            <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <User className="w-2.5 h-2.5" /> {by}
            </span>
          )}
        </div>
      </div>
      {date && (
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date}</span>
      )}
    </div>
  );
}
