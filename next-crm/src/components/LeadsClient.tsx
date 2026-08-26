"use client";
import { createClient } from '@/utils/supabase/client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, UserProfile, LeadStatus, InterestLevel, EditRequest } from '../types';
import { Search, Plus, Trash2, Pencil, Bolt, FileDown, Upload, MessageSquare, Phone, Database, Filter, AlertTriangle, Mail, Package, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import LeadModalClient from './LeadModalClient';
import StatusModalClient from './StatusModalClient';
import NotesModalClient from './NotesModalClient';
import ImportModalClient from './ImportModalClient';
import ConfirmModal from './ConfirmModal';
import BulkStatusModal from './BulkStatusModal';

interface LeadsTableProps {
  leads: Lead[];
  user: UserProfile;
  users: UserProfile[];
  approvals: EditRequest[];
}

export default function LeadsClient({ leads, user, users, approvals }: LeadsTableProps) {
  const router = useRouter();
  const navigate = router.push;
  const isAdmin = user.role === 'admin' || user.role === 'lord';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState<'dateInput' | 'brandName' | 'status'>('dateInput');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'primary' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [currentPage, setCurrentPage] = useState(1);
  const supabase = createClient();
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterProduct, filterDate, sortField, sortOrder, viewMode]);

  useEffect(() => {
    if (activeLead) {
      const updated = leads.find(l => l.id === activeLead.id);
      if (updated) setActiveLead(updated);
    }
  }, [leads]);

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Konfirmasi", type: 'danger' | 'primary' | 'success' = 'danger') => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, confirmText, type });
  };

  const addAuditLog = async (action: string, details: string) => {
    try {
      
      await supabase.from('global_audit_logs').insert([{
        id: crypto.randomUUID(),
        action,
        details,
        user_name: user.name,
        created_at: new Date().toISOString()
      }]);

    } catch (e) {
      console.error("Audit log failed", e);
    }
  };

  const filteredLeads = useMemo(() => {
    // Note: leads in App.tsx are already pre-filtered for active view,
    // but for the trash view we need the ones where isDeleted is true.
    // Wait, let's fix the App.tsx fetching logic first if it's too restrictive.
    // Actually, App.tsx fetched ALL leads but I added a manual filter there.
    // I should ensure App.tsx passes BOTH active and deleted leads or handles it.
    
    // For now, let's assume 'leads' prop contains the relevant leads for the current viewMode
    // but I'll add a safety check here.
    let result = leads.filter(l => {
      const isTrash = l.isDeleted === true;
      if (viewMode === 'active' && isTrash) return false;
      if (viewMode === 'trash' && !isTrash) return false;

      const bName = l.brandName || '';
      const cContact = l.contact || '';
      
      let matchesDate = true;
      if (filterDate) {
        let dateVal = '';
        if (filterStatus === 'ALL' || filterStatus === 'Leads') dateVal = l.dateInput || '';
        else if (filterStatus === 'Chated') dateVal = l.dateChated || l.dateInput || '';
        else if (filterStatus === 'Responsed') dateVal = l.dateResponsed || l.dateInput || '';
        else if (filterStatus === 'Set Meeting') dateVal = l.dateSetMeeting || l.dateInput || '';
        else if (filterStatus === 'Close Win' || filterStatus === 'Close Lost') dateVal = l.dateClosed || l.dateInput || '';
        else dateVal = l.dateInput || '';
        
        if (!dateVal.includes(filterDate)) {
           matchesDate = false;
        }
      }

      return (bName.toLowerCase().includes(search.toLowerCase()) || 
              cContact.includes(search)) &&
             (filterStatus === 'ALL' || l.status === filterStatus) &&
             (filterProduct === 'ALL' || (l.productOffered || []).includes(filterProduct as any)) &&
             matchesDate;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dateInput') {
        let dateA = a.dateInput || '';
        let dateB = b.dateInput || '';
        
        if (filterStatus === 'Chated') { dateA = a.dateChated || dateA; dateB = b.dateChated || dateB; }
        else if (filterStatus === 'Responsed') { dateA = a.dateResponsed || dateA; dateB = b.dateResponsed || dateB; }
        else if (filterStatus === 'Set Meeting') { dateA = a.dateSetMeeting || dateA; dateB = b.dateSetMeeting || dateB; }
        else if (filterStatus === 'Close Win' || filterStatus === 'Close Lost') { dateA = a.dateClosed || dateA; dateB = b.dateClosed || dateB; }

        comparison = new Date(dateA || 0).getTime() - new Date(dateB || 0).getTime();
      } else if (sortField === 'brandName') {
        comparison = (a.brandName || '').localeCompare(b.brandName || '');
      } else if (sortField === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, search, filterStatus, filterProduct, filterDate, sortField, sortOrder, viewMode]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const toggleSort = (field: 'dateInput' | 'brandName' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleDelete = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    showConfirm(
      "Pindahkan ke Sampah",
      `Apakah Anda yakin ingin memindahkan "${lead?.brandName}" ke tempat sampah? Data akan dihapus permanen secara otomatis setelah 30 hari.`,
      async () => {
        try {
          
          const deletedAt = new Date();
          const autoDeleteAt = new Date();
          autoDeleteAt.setDate(deletedAt.getDate() + 30);

          await supabase.from('leads').update({
            isDeleted: true,
            deletedAt: deletedAt.toISOString(),
            autoDeleteAt: autoDeleteAt.toISOString()
          }).eq('id', id);
          
          addAuditLog("MOVE_TO_TRASH", `Lead ${lead?.brandName} dipindahkan ke sampah oleh ${user.name}`);
          toast.success("Lead dipindahkan ke sampah");
        } catch (error: any) {
          toast.error("Gagal: " + error.message);
        }
      },
      "Buang ke Sampah"
    );
  };

  const handleRestore = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    try {
      
      await supabase.from('leads').update({
        isDeleted: false,
        deletedAt: null,
        autoDeleteAt: null
      }).eq('id', id);
      addAuditLog("RESTORE_LEAD", `Lead ${lead?.brandName} dipulihkan dari sampah oleh ${user.name}`);
      toast.success("Lead berhasil dipulihkan");
    } catch (error: any) {
      toast.error("Gagal memulihkan: " + error.message);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    showConfirm(
      "Hapus Permanen",
      "PERINGATAN: Tindakan ini akan menghapus data selamanya dan tidak bisa dibatalkan. Apakah Anda yakin?",
      async () => {
        try {
          
          const forecastSnap = await supabase.from('oi_forecasts').select('id').eq('lead_id', id); const docs = forecastSnap.data || [];
          for (const fd of (forecastSnap.data || [])) {
            await supabase.from('oi_forecasts').delete().eq('id', fd.id);
          }
          await supabase.from('leads').delete().eq('id', id);
          addAuditLog("PERMANENT_DELETE", `Lead ${lead?.brandName} dihapus permanen oleh ${user.name}`);
          toast.success("Lead dihapus secara permanen");
        } catch (error: any) {
          toast.error("Gagal menghapus permanen: " + error.message);
        }
      },
      "Hapus Selamanya"
    );
  };

  const handleBulkDelete = async () => {
    showConfirm(
      viewMode === 'active' ? "Pindahkan Massal ke Sampah" : "Hapus Massal Permanen",
      viewMode === 'active' 
        ? `Apakah Anda yakin ingin memindahkan ${selectedIds.size} data ke sampah?` 
        : `PERINGATAN: ${selectedIds.size} data akan dihapus SELAMANYA. Lanjutkan?`,
      async () => {
        try {
          
          const deletedAt = new Date();
          const autoDeleteAt = new Date();
          autoDeleteAt.setDate(deletedAt.getDate() + 30);

          const promises = Array.from(selectedIds).map((id: string) => {
            if (viewMode === 'active') {
              return supabase.from('leads').update({
                isDeleted: true,
                deletedAt: deletedAt.toISOString(),
                autoDeleteAt: autoDeleteAt.toISOString()
              }).eq('id', id);
            } else {
              return (async () => {
                
                const forecastSnap = await supabase.from('oi_forecasts').select('id').eq('lead_id', id); const docs = forecastSnap.data || [];
                for (const fd of (forecastSnap.data || [])) {
                  await supabase.from('oi_forecasts').delete().eq('id', fd.id);
                }
                return supabase.from('leads').delete().eq('id', id);
              })();
            }
          });
          
          await Promise.all(promises);
          addAuditLog(viewMode === 'active' ? "BULK_TRASH" : "BULK_PERMANENT_DELETE", `${selectedIds.size} leads diproses secara massal`);
          setSelectedIds(new Set());
          toast.success(`${promises.length} Lead berhasil diproses`);
        } catch (error: any) {
          toast.error("Gagal: " + error.message);
        }
      },
      viewMode === 'active' ? "Pindahkan Semua" : "Hapus Semua Selamanya"
    );
  };

  const handlePurgeOldData = async () => {
    showConfirm(
      "DANGER: Purge Pre-2026",
      "PERINGATAN: Tindakan ini akan menghapus permanen SEMUA jejak funnel history sebelum tanggal 1 Januari 2026. Data tidak bisa di-undo atau dibatalkan setelah eksekusi. Yakin 100%?",
      async () => {
        try {
          const toastId = toast.loading("Memproses penghapusan massal data pre-2026...");
          
          const { data: snapDocs } = await supabase.from('leads').select('*'); const snap = { docs: (snapDocs || []).map(d => ({ id: d.id, data: () => d })) };
          const batchData = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

          let modifiedCount = 0;
          const chunkSize = 400;

          for (let i = 0; i < batchData.length; i += chunkSize) {
            const batchUpdates = [];
            const slice = batchData.slice(i, i + chunkSize);

            for (const ld of slice) {
              const hist = (ld.funnelHistory || []) as any[];
              const preCount = hist.length;
              
              const newHist = hist.filter(h => {
                const dTime = new Date(h.date).getTime();
                return !isNaN(dTime) && dTime >= new Date("2026-01-01").getTime();
              });

              if (newHist.length !== preCount) {
                const sortedHist = [...newHist].sort((a, b) => {
                   const timeA = new Date(a.date).getTime() || 0;
                   const timeB = new Date(b.date).getTime() || 0;
                   if (timeA !== timeB) return timeB - timeA;
                   return (b.timestamp || 0) - (a.timestamp || 0);
                });

                const latest = sortedHist[0];
                const newStatus = latest ? latest.stage : "Leads";

                const getLatestDateForStage = (stageName: string) => {
                  const stageEntries = sortedHist.filter(h => h.stage === stageName);
                  return stageEntries.length > 0 ? stageEntries[0].date : "";
                };

                const updatePayload: any = {
                  funnelHistory: newHist,
                  status: newStatus,
                  dateChated: getLatestDateForStage("Chated"),
                  dateResponsed: getLatestDateForStage("Responsed"),
                  dateSetMeeting: getLatestDateForStage("Set Meeting"),
                  dateClosed: getLatestDateForStage("Close Win") || getLatestDateForStage("Close Lost")
                };

                batchUpdates.push({ id: ld.id, ...updatePayload });
                modifiedCount++;
              }
            }
            for (const u of batchUpdates) await supabase.from('leads').update(u).eq('id', u.id);
          }

          addAuditLog("PURGE_PRE_2026", `Menghapus history pre-2026 pada ${modifiedCount} leads`);
          toast.dismiss(toastId);
          toast.success(`Selesai! Berhasil membersihkan history lama pada ${modifiedCount} leads.`);
        } catch (error: any) {
          toast.error("Gagal purge data: " + error.message);
        }
      },
      "Yakin, Hapus Permanen!",
      "danger"
    );
  };

  const handleEmptyTrash = async () => {
    const trashLeads = leads.filter(l => l.isDeleted);
    if (trashLeads.length === 0) {
      toast.info("Tempat sampah sudah kosong!");
      return;
    }
    showConfirm(
      "🗑️ Kosongkan Semua Sampah",
      `PERINGATAN: ${trashLeads.length} data di tempat sampah akan DIHAPUS SELAMANYA dari server dan tidak bisa dikembalikan. Lanjutkan?`,
      async () => {
        try {
          const toastId = toast.loading(`Menghapus permanen ${trashLeads.length} data...`);
          
          let deletedCount = 0;
          const CHUNK = 20;
          for (let i = 0; i < trashLeads.length; i += CHUNK) {
            const batchUpdates = [];
            const slice = trashLeads.slice(i, i + CHUNK);
            for (const lead of slice) {
              const fcSnap = await supabase.from('oi_forecasts').select('id').eq('lead_id', lead.id);
              for (const fd of (fcSnap.data || [])) { batchUpdates.push({ _table: 'oi_forecasts', _delete: true, id: fd.id }); }
              batchUpdates.push({ _table: 'leads', _delete: true, id: lead.id });
              deletedCount++;
            }
            for (const u of batchUpdates) await supabase.from('leads').update(u).eq('id', u.id);
          }
          addAuditLog("EMPTY_TRASH", `${deletedCount} leads dihapus permanen dari sampah oleh ${user.name}`);
          toast.dismiss(toastId);
          toast.success(`✅ ${deletedCount} data berhasil dihapus permanen dari server!`);
        } catch (error: any) {
          toast.error("Gagal mengosongkan sampah: " + error.message);
        }
      },
      "Hapus Selamanya",
      "danger"
    );
  };

  const exportCSV = () => {
    const targetLeads = selectedIds.size > 0 
      ? leads.filter(l => selectedIds.has(l.id)) 
      : filteredLeads;
      
    let csv = "Tgl Input,Nama Brand,Sumber Lead,Kategori,No WA,Email,Product Offered,Status Terbaru,Minat,Rekam Jejak Funnel\n";
    targetLeads.forEach(l => {
      const hLog = l.funnelHistory.map(h => `[${h.stage}: ${h.date} by ${h.by}${h.assignedBy ? ` (assigned by ${h.assignedBy})` : ''}${h.note ? ` - ${h.note}` : ''}]`).join(' | ');
      const products = (l.productOffered || []).join(', ');
      csv += `${l.dateInput},"${l.brandName}","${l.leadSource || ''}","${l.category}",${l.contact},"${l.email || ''}","${products}",${l.status},${l.interestLevel},"${hLog}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TNT_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${targetLeads.length} Lead berhasil diexport`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Database Leads
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total {leads.length} Records Found</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 mr-2">
            <button 
              onClick={() => setViewMode('active')}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                viewMode === 'active' ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Database className="w-3 h-3" /> Active
            </button>
            <button 
              onClick={() => setViewMode('trash')}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                viewMode === 'trash' ? "bg-rose-600 text-white shadow-md shadow-rose-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Trash2 className="w-3 h-3" /> Sampah
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
            <input 
              type="text" 
              placeholder="Cari brand atau kontak..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition w-64 shadow-inner"
            />
          </div>
          
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <div className="flex gap-2 items-center mr-2">
                <button 
                  onClick={handleBulkDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 text-sm shadow-lg shadow-rose-200"
                >
                  <Trash2 className="w-4 h-4" /> {viewMode === 'active' ? 'Buang' : 'Hapus'} ({selectedIds.size})
                </button>
                {viewMode === 'active' && (
                  <button 
                    onClick={() => setIsBulkModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition shadow-lg shadow-indigo-100 flex items-center gap-2 text-sm"
                  >
                    <Bolt className="w-4 h-4" /> Status ({selectedIds.size})
                  </button>
                )}
                <div className="h-8 w-px bg-slate-200 mx-2" />
              </div>
            )}
            
            {user.role === 'lord' && (
              <button 
                onClick={handlePurgeOldData}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-rose-200 text-sm mr-2"
                title="Hapus History Pre-2026"
              >
                <Trash2 className="w-4 h-4 text-rose-100" /> Purge 2025
              </button>
            )}

            {viewMode === 'trash' && (user.role === 'lord' || user.role === 'admin') && (
              <button
                onClick={handleEmptyTrash}
                className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-rose-300 text-sm mr-2 border-2 border-rose-400"
                title="Hapus semua sampah selamanya"
              >
                <Trash2 className="w-4 h-4" /> Kosongkan Sampah ({leads.filter(l => l.isDeleted).length})
              </button>
            )}

            <button 
              onClick={exportCSV}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-teal-200 text-sm mr-2"
            >
              <FileDown className="w-4 h-4 text-teal-100" /> Super Export
            </button>

            {viewMode === 'active' && (
              <>
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-slate-200 text-sm"
                >
                  <Upload className="w-4 h-4 text-indigo-400" /> Super Import
                </button>
                
                <button 
                  onClick={() => { setEditingLead(null); setIsLeadModalOpen(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-200 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Lead
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="p-8 flex-1 overflow-hidden flex flex-col">
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 bg-slate-50 text-slate-700 mr-2"
            >
              <option value="ALL">Semua Produk</option>
              <option value="TNT">TNT</option>
              <option value="Basemen">Basemen</option>
              <option value="HYPE">HYPE</option>
            </select>
            {(['ALL', 'Leads', 'Chated', 'Responsed', 'Set Meeting', 'Hold', 'Close Win', 'Close Lost', 'Failed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filterStatus === s 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {s === 'ALL' ? 'Semua' : s}
              </button>
            ))}
            
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
            
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              title="Filter tanggal (dinamis sesuai status tab)"
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Hapus Filter Tanggal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Urutkan:</span>
            <select 
              value={sortField}
              onChange={e => toggleSort(e.target.value as any)}
              className="bg-transparent border-none text-indigo-600 focus:ring-0 cursor-pointer p-0 font-black"
            >
              <option value="dateInput">Tgl Input</option>
              <option value="brandName">Nama Brand</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto crm-card">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4" 
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand & Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Interest</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className={cn("hover:bg-slate-50/50 transition group", selectedIds.has(lead.id) && "bg-indigo-50/30")}>
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="rounded border-slate-300 text-indigo-600 cursor-pointer w-4 h-4" 
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <button 
                        onClick={() => navigate(`/lead/${lead.id}`)}
                        className="text-left font-bold text-slate-900 text-base group-hover:text-indigo-600 transition tracking-tight flex flex-col items-start group/brand"
                      >
                        <span className="flex items-center gap-1">
                          {lead.brandName}
                          <Bolt className="w-3 h-3 opacity-0 group-hover/brand:opacity-100 transition text-indigo-400" />
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal group-hover/brand:text-indigo-400 transition">Klik untuk detail</span>
                      </button>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Database className="w-3 h-3" /> {new Date(lead.dateInput || 0).toLocaleDateString('id-ID')}
                        </span>
                        <a 
                          href={`https://wa.me/${(lead.contact || '').replace(/^0/, '62')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-emerald-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {lead.contact || '-'}
                        </a>
                        {lead.leadSource && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {lead.leadSource}
                          </span>
                        )}
                        {lead.email && (
                          <a 
                            href={`mailto:${lead.email}`}
                            className="text-[11px] text-blue-500 hover:underline font-bold flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" /> {lead.email}
                          </a>
                        )}
                      </div>
                      {lead.productOffered && lead.productOffered.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Package className="w-3 h-3 text-slate-400" />
                          {lead.productOffered.map(p => (
                            <span key={p} className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight border",
                              p === 'TNT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                              p === 'Basemen' ? 'bg-slate-100 text-slate-700 border-slate-200' : 
                              'bg-amber-50 text-amber-600 border-amber-100'
                            )}>
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                      {lead.actionPlan && (
                        <p className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-2 w-fit border border-indigo-100 font-bold">
                          <Bolt className="w-3 h-3 inline mr-1" /> {lead.actionPlan}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                      {lead.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {viewMode === 'active' ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <button 
                          onClick={() => { setActiveLead(lead); setIsStatusModalOpen(true); }}
                          className={cn(
                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1",
                            getStatusColor(lead.status)
                          )}
                        >
                          {lead.status}
                        </button>
                        {(() => {
                          const sortedHistory = [...(lead.funnelHistory || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.timestamp - a.timestamp);
                          const latestAction = sortedHistory[0];
                          if (!latestAction) {
                            return (
                              <div className="flex flex-col items-center mt-0.5">
                                <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  Belum di-assign
                                </span>
                              </div>
                            );
                          }
                          
                          const recentAuthors = Array.from(new Set(sortedHistory.slice(0, 3).map(h => h.by)));
                          const isMultiPIC = recentAuthors.length > 1;

                          const isValidDate = !isNaN(new Date(latestAction.date).getTime());

                          return (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                {isValidDate ? new Date(latestAction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'} • <span className="text-slate-600">{latestAction.by}</span>
                              </span>
                              {isMultiPIC && (
                                <span 
                                  className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap cursor-help flex items-center" 
                                  title={`Riwayat PIC: ${recentAuthors.join(', ')}`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Multi PIC
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                          <Clock className="w-3 h-3" />
                          {(() => {
                            if (!lead.autoDeleteAt) return 'Segera dihapus';
                            const diff = new Date(lead.autoDeleteAt).getTime() - Date.now();
                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            return days > 0 ? `${days} Hari Lagi Dihapus` : 'Hapus Hari Ini';
                          })()}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">Status Terakhir: {lead.status}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <InterestBadge level={lead.interestLevel} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      {viewMode === 'active' ? (
                        <>
                          <button 
                            onClick={() => { setActiveLead(lead); setIsNotesModalOpen(true); }}
                            className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition shadow-sm bg-white border border-slate-100 relative"
                            title="Notes & History"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {(lead.funnelHistory?.length || 0) > 1 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black border-2 border-white">
                                {lead.funnelHistory.length - 1}
                              </span>
                            )}
                          </button>
                          <button 
                            onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true); }}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition shadow-sm bg-white border border-slate-100"
                            title="Edit Data"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDelete(lead.id)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shadow-sm bg-white border border-slate-100"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleRestore(lead.id)}
                            className="p-2.5 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-xl transition shadow-sm bg-white border border-emerald-100 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-4"
                            title="Pulihkan Lead"
                          >
                            <Database className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button 
                            onClick={() => handlePermanentDelete(lead.id)}
                            className="p-2.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition shadow-sm bg-white border border-rose-100 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-4"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Selamanya
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between sticky left-0">
              <span className="text-xs font-bold text-slate-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLeads.length)} dari {filteredLeads.length} data
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition text-slate-700 shadow-sm"
                >
                  Prev
                </button>
                <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                  Page {currentPage} / {Math.ceil(filteredLeads.length / itemsPerPage)}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredLeads.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredLeads.length / itemsPerPage)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 transition text-slate-700 shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          {filteredLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Database className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Data Found</p>
            </div>
          )}
        </div>
      </div>

      <LeadModalClient 
        isOpen={isLeadModalOpen} 
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
          router.refresh();
        }}
        lead={editingLead} 
        user={user} 
        leads={leads}
        users={users}
      />
      
      {activeLead && (
        <>
          <StatusModalClient 
            isOpen={isStatusModalOpen} 
            onClose={() => {
              setIsStatusModalOpen(false);
              router.refresh();
            }} 
            lead={activeLead} 
            user={user} 
            users={users}
          />
          <NotesModalClient 
            isOpen={isNotesModalOpen} 
            onClose={() => {
              setIsNotesModalOpen(false);
              router.refresh();
            }} 
            lead={activeLead} 
            user={user} 
            approvals={approvals}
          />
        </>
      )}

      {isBulkModalOpen && (
        <BulkStatusModal 
          isOpen={isBulkModalOpen}
          selectedLeads={leads.filter(l => selectedIds.has(l.id))} 
          onClose={() => {
            setIsBulkModalOpen(false);
            setSelectedIds(new Set());
            router.refresh();
          }}
          user={user}
          users={users}
          onSuccess={() => {}} 
        />
      )}

      <ImportModalClient
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        users={users}
      />

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
}

function getStatusColor(status: LeadStatus) {
  switch (status) {
    case 'Chated': return 'bg-blue-100 text-blue-800';
    case 'Responsed': return 'bg-purple-100 text-purple-800';
    case 'Set Meeting': return 'bg-yellow-100 text-yellow-800';
    case 'Hold': return 'bg-slate-200 text-slate-800';
    case 'Close Win': return 'bg-emerald-100 text-emerald-800';
    case 'Close Lost': return 'bg-red-100 text-red-800';
    case 'Failed': return 'bg-gray-200 text-gray-700';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function InterestBadge({ level }: { level: InterestLevel }) {
  switch (level) {
    case 'HOT': return <span className="text-red-600 font-bold flex items-center justify-center gap-1"><Bolt className="w-3 h-3" /> HOT</span>;
    case 'WARM': return <span className="text-yellow-600 font-bold">WARM</span>;
    case 'COLD': return <span className="text-blue-600 font-bold flex items-center justify-center gap-1">COLD</span>;
    default: return <span className="text-gray-400">-</span>;
  }
}
