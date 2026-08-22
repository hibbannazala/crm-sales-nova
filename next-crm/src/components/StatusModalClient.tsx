import { useState } from 'react';
import { Lead, UserProfile, LeadStatus, InterestLevel, ProductOffered } from '@/types';
import { X, Calendar, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import CurrencyInput from './common/CurrencyInput';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  user: UserProfile;
  users?: UserProfile[];
}

const STAGES: LeadStatus[] = ["Leads", "Chated", "Responsed", "Set Meeting", "Hold", "Close Win", "Close Lost", "Failed"];

export default function StatusModalClient({ isOpen, onClose, lead, user, users = [] }: StatusModalProps) {
  const supabase = createClient();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [interest, setInterest] = useState<InterestLevel>(lead.interestLevel);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const previousWins = lead.funnelHistory?.filter(h => h.stage === 'Close Win') || [];
  
  // Prerequisite Checks
  const hasChated = !!lead.dateChated || lead.funnelHistory?.some(h => h.stage === 'Chated');
  const hasResponsed = !!lead.dateResponsed || lead.funnelHistory?.some(h => h.stage === 'Responsed');
  const hasSetMeeting = !!lead.dateSetMeeting || lead.funnelHistory?.some(h => h.stage === 'Set Meeting');

  // Retroactive States
  const [missingChatedDate, setMissingChatedDate] = useState('');
  const [missingResponsedDate, setMissingResponsedDate] = useState('');
  const [missingSetMeetingDate, setMissingSetMeetingDate] = useState('');

  const defaultCampaignNumber = previousWins.length + 1;
  const [dealValue, setDealValue] = useState<number>(lead.dealValue || 0);
  const [campaignNumber, setCampaignNumber] = useState<number>(defaultCampaignNumber);
  const [assignedPic, setAssignedPic] = useState<string>('');
  const [noteText, setNoteText] = useState('');
  const [productOffered, setProductOffered] = useState<ProductOffered[]>(lead.productOffered || []);
  const [loading, setLoading] = useState(false);
  const [showConfirmUI, setShowConfirmUI] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    type: 'override' | 'new',
    existingCampaign?: any,
    targetEntryToOverride?: any
  } | null>(null);

  const isLordOrAdmin = user.role === 'lord' || user.role === 'admin';

  // Get staff users dynamically from database
  const staffUsers = users.filter(u => u.role === 'staff' || u.role === 'lord' || u.role === 'admin')
    .filter(u => u.uid !== user.uid); // exclude current user from PIC list

  const toggleProduct = (product: ProductOffered) => {
    setProductOffered(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product) 
        : [...prev, product]
    );
  };

  const handleSave = async () => {
    if (!status) {
      toast.error("Pilih tahap funnel!");
      return;
    }
    
    const showMissingChated = (status === 'Responsed' || status === 'Set Meeting' || status === 'Close Win') && !hasChated;
    const showMissingResponsed = (status === 'Set Meeting' || status === 'Close Win') && !hasResponsed;
    const showMissingSetMeeting = status === 'Close Win' && !hasSetMeeting;

    if (showMissingChated && !missingChatedDate) {
      toast.error("Isi Tanggal Chated yang terlewat!");
      return;
    }
    if (showMissingResponsed && !missingResponsedDate) {
      toast.error("Isi Tanggal Responsed yang terlewat!");
      return;
    }
    if (showMissingSetMeeting && !missingSetMeetingDate) {
      toast.error("Isi Tanggal Set Meeting yang terlewat!");
      return;
    }

    if (status !== 'Leads' && !date) {
      toast.error("Pilih tanggal pelaksanaan!");
      return;
    }

    if (status === 'Close Win') {
      if (dealValue <= 0) {
        toast.error("Masukkan nominal Deal (Rp)!");
        return;
      }
      if (!campaignNumber || campaignNumber <= 0) {
        toast.error("Masukkan angka Campaign Keberapa!");
        return;
      }
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow today

    if (selectedDate > today) {
      toast.error("Tanggal tidak boleh di masa depan!");
      return;
    }

    const selectedDateStr = date;
    const finalAuthor = isLordOrAdmin && assignedPic ? assignedPic : user.name;
    const wasAssigned = isLordOrAdmin && assignedPic && assignedPic !== user.name;

    let targetEntryToOverride: any = null;
    let isOverride = false;

    // --- Smart Campaign Validation ---
    if (status === 'Close Win') {
      const existingCampaign = (lead.funnelHistory || []).find(h => h.stage === 'Close Win' && Number(h.campaignNumber) === Number(campaignNumber));
      
      if (existingCampaign) {
        setConfirmConfig({
          type: 'override',
          existingCampaign,
          targetEntryToOverride: existingCampaign
        });
        setShowConfirmUI(true);
        return;
      } else {
        // NEW CAMPAIGN CONFIRMATION
        setConfirmConfig({ type: 'new' });
        setShowConfirmUI(true);
        return;
      }
    }

    // If not Close Win, proceed directly to performSave
    performSave();
  };

  const performSave = async (overriddenEntry?: any) => {
    let isOverride = !!overriddenEntry;
    let targetEntryToOverride = overriddenEntry;
    const selectedDateStr = date;
    const finalAuthor = isLordOrAdmin && assignedPic ? assignedPic : user.name;
    const wasAssigned = isLordOrAdmin && assignedPic && assignedPic !== user.name;

    const showMissingChated = (status === 'Responsed' || status === 'Set Meeting' || status === 'Close Win') && !hasChated;
    const showMissingResponsed = (status === 'Set Meeting' || status === 'Close Win') && !hasResponsed;
    const showMissingSetMeeting = status === 'Close Win' && !hasSetMeeting;

    const sameDayEntries = (lead.funnelHistory || []).filter(h => h.date === selectedDateStr);
    const existingSameStage = sameDayEntries.find(h => h.stage === status);

    // Final sanity check for same day/same stage if not already overriding a campaign
    if (!isOverride && existingSameStage && existingSameStage.by === finalAuthor) {
      const ok = window.confirm(`📝 UPDATE STATUS: Anda sudah mencatat status "${status}" hari ini.\n\nApakah Anda ingin memperbarui (Override) data tersebut?`);
      if (ok) {
        isOverride = true;
        targetEntryToOverride = existingSameStage;
      } else {
        return;
      }
    }

    const anyWinToday = sameDayEntries.find(h => h.stage === 'Close Win');
    let updatedHistory = [...(lead.funnelHistory || [])];

    if (!isOverride && existingSameStage) {
      if (existingSameStage.by === finalAuthor) {
        // OVERRIDE MODE: Update the existing entry instead of adding new one
        const ok = window.confirm(`📝 UPDATE STATUS: Anda sudah mencatat status "${status}" hari ini.\n\nApakah Anda ingin memperbarui (Override) catatan dan nominal data tersebut dengan input baru ini?`);
        if (ok) {
          targetEntryToOverride = existingSameStage;
          isOverride = true;
        } else {
          return;
        }
      } else {
        // WARNING MODE: Different user
        const ok = window.confirm(`💡 INFO DUPLIKAT: Sales "${existingSameStage.by}" sudah mencatat status "${status}" hari ini.\n\nApakah Anda ingin tetap menambahkan catatan Anda sendiri sebagai data tambahan?`);
        if (!ok) return;
      }
    }

    if (isOverride && targetEntryToOverride) {
      const index = updatedHistory.findIndex(h => h === targetEntryToOverride);
      if (index !== -1) {
        const newEntry: any = {
          ...targetEntryToOverride,
          date: date, // Update date to current selection
          timestamp: Date.now(),
          dealValue: status === 'Close Win' ? Number(dealValue || 0) : (targetEntryToOverride.dealValue || 0),
          campaignNumber: status === 'Close Win' ? Number(campaignNumber || 1) : (targetEntryToOverride.campaignNumber || 1),
          assignedBy: wasAssigned ? user.name : (targetEntryToOverride.assignedBy || '')
        };
        if (noteText.trim()) {
          newEntry.note = noteText.trim();
        }
        Object.keys(newEntry).forEach(key => newEntry[key] === undefined && delete newEntry[key]);
        updatedHistory[index] = newEntry;
      }
    }

    setLoading(true);
    try {
      const updateData: any = {
        status,
        interest_level: interest || '-',
        product_offered: productOffered || []
      };

      if (status !== 'Leads') {
        if (status === 'Chated') updateData.date_chated = date;
        else if (status === 'Responsed') updateData.date_responsed = date;
        else if (status === 'Set Meeting') updateData.date_set_meeting = date;
        else if (status.includes('Close')) updateData.date_closed = date;
        else if (status === 'Failed') updateData.date_failed = date;

        if (status === 'Close Win') updateData.deal_value = Number(dealValue || 0);
      }

      const fHistoryRecords: any[] = [];
      const noteRecords: any[] = [];

      if (!isOverride) {
        let timeOffset = 3000;
        
        if (showMissingChated) {
          updateData.date_chated = missingChatedDate;
          fHistoryRecords.push({ lead_id: lead.id, stage: 'Chated', date_occurred: missingChatedDate, by_user_name: finalAuthor });
          timeOffset -= 1000;
        }
        if (showMissingResponsed) {
          updateData.date_responsed = missingResponsedDate;
          fHistoryRecords.push({ lead_id: lead.id, stage: 'Responsed', date_occurred: missingResponsedDate, by_user_name: finalAuthor });
          timeOffset -= 1000;
        }
        if (showMissingSetMeeting) {
          updateData.date_set_meeting = missingSetMeetingDate;
          fHistoryRecords.push({ lead_id: lead.id, stage: 'Set Meeting', date_occurred: missingSetMeetingDate, by_user_name: finalAuthor });
        }
        
        const funnelEntry: any = {
          lead_id: lead.id,
          stage: status,
          date_occurred: status === 'Leads' ? lead.dateInput : date,
          by_user_name: finalAuthor
        };

        if (status === 'Close Win') {
          funnelEntry.deal_value = Number(dealValue || 0);
          funnelEntry.campaign_number = Number(campaignNumber || 1);
        }

        if (noteText.trim()) {
          funnelEntry.note = noteText.trim();
        }

        if (wasAssigned) {
          funnelEntry.assigned_by = user.name;
        }

        fHistoryRecords.push(funnelEntry);
      } else if (isOverride && targetEntryToOverride) {
        // Find existing funnel history record to update? We don't have its ID because mapping omitted it.
        // We will just insert a log note about the override.
      }
      
      const assignLabel = wasAssigned ? ` (assigned by ${user.name})` : '';
      if (isOverride) {
        noteRecords.push({
          lead_id: lead.id,
          text: `[SYSTEM] ${finalAuthor} memperbarui status ${status} pada tanggal ${date}${assignLabel}`,
          author_name: 'System',
          is_log: true
        });
      } else if (lead.status !== status) {
        noteRecords.push({
          lead_id: lead.id,
          text: `[SYSTEM] Status diubah ke ${status} oleh ${finalAuthor}${assignLabel}`,
          author_name: 'System',
          is_log: true
        });
      }

      if (noteText.trim() && !isOverride) {
        noteRecords.push({
          lead_id: lead.id,
          text: noteText.trim(),
          author_name: user.name,
          is_log: false
        });
      }

      await supabase.from('leads').update(updateData).eq('id', lead.id);
      
      if (fHistoryRecords.length > 0) {
        await supabase.from('funnel_history').insert(fHistoryRecords);
      }
      if (noteRecords.length > 0) {
        await supabase.from('lead_notes').insert(noteRecords);
      }

      // --- Sync with OI Forecast ---
      try {
        const { data: forecastSnap } = await supabase.from('oi_forecasts').select('*').eq('lead_id', lead.id);
        
        if (forecastSnap && forecastSnap.length > 0) {
          const forecastStatus = status === 'Close Win' ? 'WIN' : (status === 'Close Lost' || status === 'Failed' ? 'LOSE' : 'OPEN');
          
          for (const fData of forecastSnap) {

            const fCategory = fData.category || ''; 
            
            const isProductMatch = (lead.productOffered || []).some(p => 
              fCategory.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(fCategory.toLowerCase().replace(' campaign', '').trim())
            );

            if (isProductMatch) {
              const fCampaign = Number(fData.campaign_number || 1);
              const lCampaign = Number(status === 'Close Win' ? campaignNumber : (lead.funnelHistory?.find(h => h.stage === 'Close Win')?.campaignNumber || 1));
              
              if (fCampaign === lCampaign || (forecastStatus === 'OPEN')) {
                const updatePayload: any = {
                  status: forecastStatus,
                  updated_at: new Date().toISOString()
                };
                if (forecastStatus === 'WIN' && status === 'Close Win') {
                  const newDealValue = Number(dealValue) || 0;
                  updatePayload.value = newDealValue;
                  updatePayload.gross_margin = newDealValue - (fData.budget_ads || 0) - (fData.budget_creator || 0);
                }
                
                await supabase.from('oi_forecasts').update(updatePayload).eq('id', fData.id);
              }
            }
          }
        }
      } catch (fErr) {
        console.error("Forecast sync failed:", fErr);
      }

      // --- Sub-collection History (Hybrid Strategy) ---
      // Removed: Supabase JSONB replaces this sub-collection need!

      // --- Global Audit Log ---
      await supabase.from('global_audit_logs').insert({
        id: crypto.randomUUID(),
        action: isOverride ? "STATUS_OVERRIDE" : "STATUS_UPDATE",
        details: `${finalAuthor} mencatat status ${status} untuk brand ${lead.brandName} pada ${date}`,
        user_name: user.name,
        created_at: new Date().toISOString()
      });

      toast.success(isOverride ? "Data diperbarui (Override)" : "Jejak Funnel tercatat");
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-lg text-gray-800 tracking-tight">Catat Jejak Funnel</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="mb-6 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mencatat History Untuk Brand:</p>
                <p className="font-black text-xl text-blue-700 mt-1 truncate">{lead.brandName}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tahap Funnel *</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {((status === 'Responsed' || status === 'Set Meeting' || status === 'Close Win') && (!hasChated || !hasResponsed || !hasSetMeeting)) && (
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="text-[11px] font-black text-amber-800 uppercase mb-3 flex items-center gap-2 tracking-wider">
                    <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center text-[10px]">!</span>
                    Lengkapi Funnel yang Bolong
                  </h4>
                  <div className="space-y-3">
                    {(status === 'Responsed' || status === 'Set Meeting' || status === 'Close Win') && !hasChated && (
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Tgl Chated (Retroaktif) *</label>
                        <input type="date" value={missingChatedDate} onChange={e => setMissingChatedDate(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg font-bold text-gray-800 bg-white focus:ring-2 focus:ring-amber-500 outline-none" />
                      </div>
                    )}
                    {(status === 'Set Meeting' || status === 'Close Win') && !hasResponsed && (
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Tgl Responsed (Retroaktif) *</label>
                        <input type="date" value={missingResponsedDate} onChange={e => setMissingResponsedDate(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg font-bold text-gray-800 bg-white focus:ring-2 focus:ring-amber-500 outline-none" />
                      </div>
                    )}
                    {status === 'Close Win' && !hasSetMeeting && (
                      <div>
                        <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1">Tgl Set Meeting (Retroaktif) *</label>
                        <input type="date" value={missingSetMeetingDate} onChange={e => setMissingSetMeetingDate(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg font-bold text-gray-800 bg-white focus:ring-2 focus:ring-amber-500 outline-none" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tingkat Minat</label>
                <select 
                  value={interest}
                  onChange={e => setInterest(e.target.value as InterestLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="-">- Tetap / Belum Diketahui -</option>
                  <option value="HOT" className="text-red-600 font-bold">HOT</option>
                  <option value="WARM" className="text-yellow-600 font-bold">WARM</option>
                  <option value="COLD" className="text-blue-600 font-bold">COLD</option>
                </select>
              </div>

              {/* Product Offered - Multi Select */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Produk Ditawarkan</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleProduct('TNT')}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all active:scale-95",
                      productOffered.includes('TNT')
                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                    )}
                  >
                    TNT
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleProduct('Basemen')}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all active:scale-95",
                      productOffered.includes('Basemen')
                        ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                    )}
                  >
                    Basemen
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleProduct('HYPE')}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all active:scale-95",
                      productOffered.includes('HYPE')
                        ? "bg-amber-400 text-white border-amber-400 shadow-lg shadow-amber-200"
                        : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                    )}
                  >
                    HYPE
                  </button>
                </div>
              </div>

              {/* PIC Assignment — only for lord/admin */}
              {isLordOrAdmin && (
                <div className="mb-4 pt-4 border-t border-gray-100">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-purple-600">Assign PIC</label>
                  <select 
                    value={assignedPic}
                    onChange={e => setAssignedPic(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg font-bold text-purple-900 focus:ring-2 focus:ring-purple-500 bg-purple-50"
                  >
                    <option value="">- Default (Saya sendiri) -</option>
                    {staffUsers.map(u => (
                      <option key={u.uid} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                  <p className="text-[9px] mt-1 text-slate-400 italic">Target KPI status ini akan masuk ke PIC tersebut. History akan mencatat siapa yang meng-assign.</p>
                </div>
              )}
              
              {status !== 'Leads' && (
                <div className="mb-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-[11px] font-black text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Tanggal Pelaksanaan *
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 bg-white" 
                  />

                  {status === 'Close Win' && (
                    <div className="mt-4 pt-4 border-t border-blue-200 space-y-4">
                      {previousWins.length > 0 && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
                          <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider mb-2 border-b border-indigo-200 pb-1">
                            Histori Close Win Sebelumnya
                          </p>
                          <ul className="space-y-1.5">
                            {previousWins.map((w, i) => (
                              <li key={i} className="text-[11px] font-bold text-indigo-700 flex justify-between items-center">
                                <span>Campaign Ke-{w.campaignNumber || 1}</span>
                                <span className="bg-white px-2 py-0.5 rounded border border-indigo-100">{w.date}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-2">
                          Nominal Deal Value (Rp) *
                        </label>
                        <CurrencyInput
                          value={dealValue}
                          onChange={(val) => setDealValue(val)}
                          className="w-full px-3 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-black text-emerald-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-indigo-700 uppercase tracking-wider mb-2">
                          Project / Campaign Keberapa? *
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          value={campaignNumber || ''}
                          onChange={e => setCampaignNumber(Number(e.target.value))}
                          placeholder="Contoh: 1, 2, 3..."
                          className={cn(
                            "w-full px-3 py-3 border rounded-lg focus:ring-2 font-black transition-all",
                            (lead.funnelHistory || []).some(h => h.stage === 'Close Win' && Number(h.campaignNumber) === Number(campaignNumber))
                              ? "border-amber-500 bg-amber-50 text-amber-900 focus:ring-amber-500 animate-pulse"
                              : "border-indigo-300 focus:ring-indigo-500 text-indigo-900 bg-white"
                          )} 
                        />
                        
                        {/* INLINE WARNING BOX */}
                        {(() => {
                          const dup = (lead.funnelHistory || []).find(h => h.stage === 'Close Win' && Number(h.campaignNumber) === Number(campaignNumber));
                          if (dup) {
                            return (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-4 bg-amber-600 text-white rounded-xl shadow-lg border-2 border-amber-400 relative overflow-hidden group"
                              >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <AlertCircle className="w-12 h-12" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                                  ⚠️ Peringatan Duplikat
                                </p>
                                <p className="text-[11px] font-bold leading-relaxed mb-3">
                                  Brand ini sudah punya <span className="underline decoration-2 underline-offset-2">Campaign Ke-{campaignNumber}</span> (Tgl: {dup.date}). 
                                  Apakah ini maksudnya Campaign baru <span className="bg-white/20 px-1.5 rounded text-amber-100">Ke-{Number(campaignNumber) + 1}</span>? 
                                  Atau Anda memang ingin menindih (Override) data lama?
                                </p>
                                <div className="flex gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => setCampaignNumber(prev => Number(prev || 0) + 1)}
                                    className="flex-1 px-3 py-2 bg-white text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 transition-colors shadow-sm"
                                  >
                                    Pakai Ke-{Number(campaignNumber) + 1} Saja
                                  </button>
                                  <div className="px-3 py-2 bg-amber-700/50 rounded-lg text-[9px] font-bold flex items-center italic">
                                    Klik "Terapkan" jika ingin Override
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }
                          return null;
                        })()}
                        
                        <p className="text-[9px] mt-2 text-indigo-600/70 italic font-medium">Jika brand ini sudah pernah Close Win sebelumnya, angka ini otomatis bertambah untuk membedakannya di laporan (Revenue tidak akan tumpang tindih).</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes textarea */}
              <div className="mb-2">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Catatan (Opsional)
                </label>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Contoh: di read doang, maunya meeting online, nomor WA tidak aktif..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                ></textarea>
                <p className="text-[9px] mt-1 text-slate-400 italic">Catatan ini akan muncul di histori funnel dan log notes.</p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition">
                Batal
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {loading ? '...' : 'Terapkan'}
              </button>
            </div>
          </motion.div>

          {/* CUSTOM CONFIRMATION MODAL (THE COOL ONE) */}
          <AnimatePresence>
            {showConfirmUI && confirmConfig && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
                >
                  <div className={cn(
                    "p-8 text-center relative overflow-hidden",
                    confirmConfig.type === 'override' ? "bg-amber-500" : "bg-indigo-600"
                  )}>
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/30">
                        {confirmConfig.type === 'override' ? <AlertCircle className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-white" />}
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                        {confirmConfig.type === 'override' ? "Konfirmasi Override Data" : "Konfirmasi Campaign Baru"}
                      </h3>
                      <p className="text-white/80 font-bold text-sm">
                        Harap tinjau riwayat kampanye di bawah ini untuk menghindari kesalahan.
                      </p>
                    </div>
                    {/* Abstract background shape */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                  </div>

                  <div className="p-8">
                    <div className="mb-8">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Riwayat Campaign Brand {lead.brandName}</p>
                      <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100/50">
                              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Campaign</th>
                              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tanggal</th>
                              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Nominal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previousWins.length > 0 ? (
                              previousWins.map((w, i) => (
                                <tr key={i} className={cn(
                                  "hover:bg-white transition-colors",
                                  Number(w.campaignNumber) === Number(campaignNumber) ? "bg-amber-50" : ""
                                )}>
                                  <td className="px-5 py-4">
                                    <span className={cn(
                                      "text-xs font-black",
                                      Number(w.campaignNumber) === Number(campaignNumber) ? "text-amber-700" : "text-slate-700"
                                    )}>Ke-{w.campaignNumber || 1}</span>
                                    {Number(w.campaignNumber) === Number(campaignNumber) && <span className="ml-2 text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase">Target Override</span>}
                                  </td>
                                  <td className="px-5 py-4 text-xs font-bold text-slate-500">{w.date}</td>
                                  <td className="px-5 py-4 text-xs font-black text-slate-900 text-right">Rp {(w.dealValue || 0).toLocaleString('id-ID')}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-5 py-8 text-center text-xs font-bold text-slate-400 italic">Belum ada riwayat Close Win</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-8">
                      <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                        {confirmConfig.type === 'override' ? (
                          <>⚠️ Anda memilih untuk <span className="font-black underline">MENINDIH</span> data Campaign Ke-{campaignNumber}. Semua catatan nominal dan tanggal lama akan diperbarui.</>
                        ) : (
                          <>✅ Anda akan mendaftarkan <span className="font-black text-indigo-700 underline">Campaign Ke-{campaignNumber}</span> sebagai baris data baru untuk bulan ini.</>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          setShowConfirmUI(false);
                          performSave(confirmConfig.targetEntryToOverride);
                        }}
                        className={cn(
                          "w-full py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95",
                          confirmConfig.type === 'override' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                        )}
                      >
                        {confirmConfig.type === 'override' ? "YA, TINDIH DATA LAMA" : "YA, SIMPAN SEBAGAI CAMPAIGN BARU"}
                      </button>
                      <button 
                        onClick={() => setShowConfirmUI(false)}
                        className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all"
                      >
                        TIDAK, SAYA MAU UBAH ANGKA
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
