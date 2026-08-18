"use client";
import { useState } from 'react';
import { Lead, UserProfile, LeadStatus, InterestLevel } from '../types';
import { X, Calendar, Edit3, MessageSquare } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import CurrencyInput from './common/CurrencyInput';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Lead[];
  user: UserProfile;
  users?: UserProfile[];
  onSuccess: () => void;
}

const STAGES: LeadStatus[] = ["Leads", "Chated", "Responsed", "Set Meeting", "Hold", "Close Win", "Close Lost", "Failed"];

export default function BulkStatusModal({ isOpen, onClose, selectedLeads, user, users = [], onSuccess }: BulkStatusModalProps) {
  const supabase = createClient();
  const [status, setStatus] = useState<LeadStatus>('Chated');
  const [interest, setInterest] = useState<InterestLevel>('-');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [wrongDate, setWrongDate] = useState('');
  const [dealValue, setDealValue] = useState<number>(0);
  const [note, setNote] = useState('');
  const [assignedPic, setAssignedPic] = useState<string>('');
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLordOrAdmin = user.role === 'lord' || user.role === 'admin';
  const staffUsers = users.filter(u => u.role === 'staff' || u.role === 'lord' || u.role === 'admin')
    .filter(u => u.uid !== user.uid);

  const handleSave = async () => {
    if (isCorrectionMode) {
       if (!wrongDate || !date) {
         toast.error("Pilih Tanggal Salah dan Tanggal Benar!");
         return;
       }
    } else {
      if (!status) {
        toast.error("Pilih tahap funnel!");
        return;
      }
      if (status !== 'Leads' && !date) {
        toast.error("Pilih tanggal pelaksanaan!");
        return;
      }
      if (status === 'Close Win' && dealValue <= 0) {
        toast.error("Masukkan nominal Deal (Rp) yang akan menimpa seluruh entri terpilih!");
        return;
      }
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      toast.error("Tanggal tidak boleh di masa depan!");
      return;
    }

    const finalAuthor = isLordOrAdmin && assignedPic ? assignedPic : user.name;
    const wasAssigned = isLordOrAdmin && assignedPic && assignedPic !== user.name;

    // Analysis before batch
    let myOverrides = 0;
    let othersDuplicates = 0;
    let hasWinConflict = false;

    selectedLeads.forEach(l => {
      const sameDay = (l.funnelHistory || []).filter(h => h.date === date);
      const sameStage = sameDay.find(h => h.stage === status);
      const anyWin = sameDay.find(h => h.stage === 'Close Win');
      
      if (sameStage) {
        if (sameStage.by === finalAuthor) myOverrides++;
        else othersDuplicates++;
      }
      if (status === 'Close Win' && anyWin && (!sameStage || sameStage.by !== finalAuthor)) {
        hasWinConflict = true;
      }
    });

    if (myOverrides > 0 || othersDuplicates > 0 || hasWinConflict) {
      let msg = `⚠️ ANALISIS BULK UPDATE (Tanggal: ${date}):\n\n`;
      if (myOverrides > 0) msg += `- ${myOverrides} Lead akan di-OVERRIDE (Anda sudah mencatat status ini hari ini).\n`;
      if (othersDuplicates > 0) msg += `- ${othersDuplicates} Lead sudah dicatat oleh SALES LAIN hari ini (Akan terhitung dobel).\n`;
      if (hasWinConflict) msg += `- Terdapat konflik "Close Win" hari ini pada salah satu brand.\n`;
      msg += `\nLanjutkan eksekusi massal?`;
      
      if (!window.confirm(msg)) return;
    }

    if (isCorrectionMode) {
      if (!window.confirm(`MODE KOREKSI TANGGAL AKTIF!\n\nAnda akan MENGGANTI tanggal histori tahap "${status}" menjadi "${date}" untuk ${selectedLeads.length} Lead. \n\nTindakan ini tidak akan mengubah Status Utama Lead (kecuali status lead saat ini adalah ${status}). Lanjutkan?`)) return;
    }

    setLoading(true);
    try {
      const promises = [];

      if (selectedLeads.length > 500) {
         toast.error("Firebase hanya mengizinkan 500 update massal sekaligus.");
         setLoading(false);
         return;
      }

      for (const lead of selectedLeads) {
        
        const updateData: any = {};
        
        const cleanUndefined = (obj: any) => {
          if (Array.isArray(obj)) {
            obj.forEach(item => typeof item === 'object' && item !== null && cleanUndefined(item));
          } else if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
              if (obj[key] === undefined) {
                delete obj[key];
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                cleanUndefined(obj[key]);
              }
            });
          }
          return obj;
        };

        if (isCorrectionMode) {
          let updatedHistory = [...(lead.funnelHistory || [])];
          let madeChanges = false;
          
          updatedHistory = updatedHistory.map(h => {
             if (h.date === wrongDate) {
                 madeChanges = true;
                 return { ...h, date: date };
             }
             return h;
          });

          if (madeChanges) {
              updateData.funnelHistory = updatedHistory;
              if (lead.dateInput === wrongDate) updateData.dateInput = date;
              if (lead.dateChated === wrongDate) updateData.dateChated = date;
              if (lead.dateResponsed === wrongDate) updateData.dateResponsed = date;
              if (lead.dateSetMeeting === wrongDate) updateData.dateSetMeeting = date;
              if (lead.dateClosed === wrongDate) updateData.dateClosed = date;
              if (lead.dateFailed === wrongDate) updateData.dateFailed = date;

              const newNotes = [...(lead.notes || [])];
              newNotes.push({
                 text: `[SYSTEM] Histori tanggal ${wrongDate} dikoreksi menjadi ${date} secara masal oleh ${user.name}`,
                 author: 'System',
                 timestamp: new Date().toISOString(),
                 isLog: true
              });
              updateData.notes = newNotes;
              cleanUndefined(updateData);
              promises.push(supabase.from('leads').update(updateData).eq('id', lead.id));

          }
          continue;
        }

        if (interest !== '-') updateData.interestLevel = interest;
        updateData.status = status;

        if (status !== 'Leads') {
          if (status === 'Chated') updateData.dateChated = date;
          else if (status === 'Responsed') updateData.dateResponsed = date;
          else if (status === 'Set Meeting') updateData.dateSetMeeting = date;
          else if (status.includes('Close')) updateData.dateClosed = date;
          if (status === 'Failed') updateData.dateFailed = date;
          if (status === 'Close Win') updateData.dealValue = Number(dealValue);
        }

        let updatedHistory = [...(lead.funnelHistory || [])];
        let existingSelf: any = null;

        const sameDay = updatedHistory.filter(h => h.date === date);
          existingSelf = sameDay.find(h => h.stage === status && h.by === finalAuthor);

          if (existingSelf) {
            const index = updatedHistory.findIndex(h => h === existingSelf);
            updatedHistory[index] = {
              ...existingSelf,
              timestamp: Date.now(),
              note: note.trim() || existingSelf.note,
              dealValue: status === 'Close Win' ? Number(dealValue) : existingSelf.dealValue,
              assignedBy: wasAssigned ? user.name : existingSelf.assignedBy
            };
          } else {
            const funnelEntry: any = {
              stage: status,
              date: status === 'Leads' ? lead.dateInput : date,
              by: finalAuthor,
              timestamp: Date.now()
            };
            if (status === 'Close Win') {
              funnelEntry.dealValue = Number(dealValue);
              funnelEntry.campaignNumber = (lead.funnelHistory?.filter(h => h.stage === 'Close Win').length || 0) + 1;
            }
            if (note.trim()) funnelEntry.note = note.trim();
            if (wasAssigned) funnelEntry.assignedBy = user.name;
            updatedHistory.push(funnelEntry);
          }
          updateData.funnelHistory = updatedHistory;


        const newNotes = [...(lead.notes || [])];

        if (lead.status !== status || existingSelf) {
          const mode = existingSelf ? "OVERRIDE" : "BULK";
          newNotes.push({
            text: `[SYSTEM] Status ${mode} diubah ke ${status} oleh ${finalAuthor}${wasAssigned ? ` (assigned by ${user.name})` : ''}`,
            author: 'System',
            timestamp: new Date().toISOString(),
            isLog: true
          });
        }
        
        if (note.trim() && !existingSelf) {
          newNotes.push({
            text: note.trim(),
            author: user.name,
            timestamp: new Date().toISOString(),
            isLog: false
          });
        }
        
        updateData.notes = newNotes;
        
        cleanUndefined(updateData);
        promises.push(supabase.from('leads').update(updateData).eq('id', lead.id));

        

      }
      await Promise.all(promises);

      // Audit Log with Limit check
      await supabase.from('global_audit_logs').insert([{
        action: "BULK_STATUS_UPDATE",
        details: `${user.name} mengupdate ${selectedLeads.length} leads ke status ${status}. Overrides: ${myOverrides}, Duplikat: ${othersDuplicates}`,
        user: user.name,
        timestamp: new Date().toISOString()
      }]);

      // Audit log limit check removed for Supabase;
      toast.success("Berhasil eksekusi status massal");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Gagal melakukan aksi massal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
          >
            <div className="px-6 py-5 border-b border-indigo-50 flex justify-between items-center bg-indigo-600/5">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/20">
                  {selectedLeads.length}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-800 tracking-tight leading-tight">Bulk Status Update</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Tindakan massal tidak dapat di-_undo_</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center border border-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-5">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                {!isCorrectionMode && (
                  <>
                    <label className="block text-[11px] font-black text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Set Tahap Funnel Baru
                    </label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value as LeadStatus)}
                      className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all outline-none"
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isCorrectionMode"
                    checked={isCorrectionMode}
                    onChange={e => setIsCorrectionMode(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="isCorrectionMode" className="text-xs font-bold text-indigo-900 cursor-pointer">
                    Mode Koreksi Tanggal (Ubah Histori Tanpa Nambah Baru)
                  </label>
                </div>
              </div>
              
              {isCorrectionMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tanggal Salah (Lama)
                    </label>
                    <input 
                      type="date" 
                      value={wrongDate}
                      onChange={e => setWrongDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-600 focus:ring-2 focus:ring-rose-600 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Tanggal Benar (Baru)
                    </label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-600 outline-none" 
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Update Level Minat</label>
                    <select 
                      value={interest}
                      onChange={e => setInterest(e.target.value as InterestLevel)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="-">- Abaikan / Jangan Ubah -</option>
                      <option value="HOT" className="text-red-600">Jadikan HOT</option>
                      <option value="WARM" className="text-yellow-600">Jadikan WARM</option>
                      <option value="COLD" className="text-blue-600">Jadikan COLD</option>
                    </select>
                  </div>

                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                       <Calendar className="w-3 h-3" /> Tanggal Eksekusi
                     </label>
                     <input 
                       type="date" 
                       value={date}
                       onChange={e => setDate(e.target.value)}
                       disabled={status === 'Leads'}
                       className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                     />
                  </div>
                </div>
              )}

              {!isCorrectionMode && isLordOrAdmin && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                  <label className="block text-[11px] font-black text-purple-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    Assign PIC
                  </label>
                  <select 
                    value={assignedPic}
                    onChange={e => setAssignedPic(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all outline-none"
                  >
                    <option value="">- Default (Saya sendiri) -</option>
                    {staffUsers.map(u => (
                      <option key={u.uid} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-2 text-slate-500 font-medium">Bila diisi, puluhan data ini akan menyumbang KPI sepenuhnya ke PIC tersebut.</p>
                </div>
              )}

              {!isCorrectionMode && status === 'Close Win' && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <label className="block text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-2">
                    Keseragaman Deal Value (Rp) *
                  </label>
                  <CurrencyInput
                    value={dealValue}
                    onChange={(val) => setDealValue(val)}
                    className="w-full px-3 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-black text-emerald-900 bg-white"
                  />
                </div>
              )}

              {!isCorrectionMode && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Tembuskan Catatan Seragam (Opsional)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Contoh: Pengiriman promo katalog 4.4"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none resize-none custom-scrollbar"
                  ></textarea>
                  <p className="text-[9px] text-slate-400 font-medium mt-1.5 italic">Catatan ini akan tersalin ke tab Notes pada masing-masing Brand terpilih.</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 capitalize bg-slate-200/50 px-2 py-1 rounded">PIC: {user.name}</span>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                  Batalkan
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none min-w-[120px]"
                >
                  {loading ? 'Menyuntik Data...' : 'Eksekusi Massal'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

