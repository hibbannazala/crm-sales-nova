import { useState } from 'react';
import { RolePermissions, PermissionSet, DEFAULT_PERMISSIONS } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Shield, Lock, Save, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface PermissionSettingsProps {
  rolePermissions: RolePermissions;
}

const PERMISSION_LABELS: Record<keyof PermissionSet, { label: string; desc: string; category: string }> = {
  canManageUsers: { label: 'User Management', desc: 'Approve, promote, revoke akses, ganti nama staff', category: 'Administration' },
  canSetTargets: { label: 'Set Targets', desc: 'Set target bulanan (Chat, Meeting, Revenue)', category: 'Administration' },
  canApproveEdits: { label: 'Approve Edit Requests', desc: 'Setujui/tolak perubahan data dari Staff', category: 'Administration' },
  canAssignPIC: { label: 'Assign PIC', desc: 'Assign PIC ke staff lain saat update status', category: 'Leads' },
  canDeleteLeads: { label: 'Delete Leads', desc: 'Hapus lead individual', category: 'Leads' },
  canBulkDelete: { label: 'Bulk Delete', desc: 'Hapus banyak lead sekaligus', category: 'Leads' },
  canEditDealValue: { label: 'Edit Deal Value', desc: 'Ubah nominal deal pada Close Win', category: 'Leads' },
  canImportCSV: { label: 'Import CSV', desc: 'Akses Super Import untuk upload database', category: 'Leads' },
  canEditFunnelHistory: { label: 'Edit Funnel History', desc: 'Edit entry histori funnel secara siluman', category: 'History & Notes' },
  canDeleteFunnelHistory: { label: 'Delete Funnel History', desc: 'Hapus entry histori funnel', category: 'History & Notes' },
  canClearAllHistory: { label: 'Clear All History', desc: 'Bersihkan semua histori & notes sekaligus', category: 'History & Notes' },
  canDeleteNotes: { label: 'Delete Notes', desc: 'Hapus catatan individual pada lead', category: 'History & Notes' },
};

const CATEGORIES = ['Administration', 'Leads', 'History & Notes'];

export default function PermissionSettings({ rolePermissions }: PermissionSettingsProps) {
  const [perms, setPerms] = useState<RolePermissions>(rolePermissions);
  const [saving, setSaving] = useState(false);

  const togglePermission = (role: 'admin' | 'staff', key: keyof PermissionSet) => {
    setPerms(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key]
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "permissions"), perms);
      toast.success("Hak akses berhasil disimpan!");
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPerms(DEFAULT_PERMISSIONS);
    toast.info("Dikembalikan ke default. Klik Simpan untuk menerapkan.");
  };

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                <Lock className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Permission Settings</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium ml-14">Atur hak akses untuk setiap role. Lord selalu memiliki semua akses.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset Default
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-xs font-bold text-slate-500">Lord — Selalu aktif (tidak bisa diubah)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-xs font-bold text-slate-500">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-slate-500">Staff</span>
          </div>
        </div>

        {CATEGORIES.map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> {category}
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">Permission</th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> Lord
                      </div>
                    </th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Admin
                      </div>
                    </th>
                    <th className="text-center px-4 py-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Staff
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(PERMISSION_LABELS) as (keyof PermissionSet)[])
                    .filter(key => PERMISSION_LABELS[key].category === category)
                    .map(key => (
                      <tr key={key} className="border-b border-slate-50 last:border-0 hover:bg-slate-25 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800">{PERMISSION_LABELS[key].label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{PERMISSION_LABELS[key].desc}</p>
                        </td>
                        {/* Lord - always on */}
                        <td className="text-center px-4 py-4">
                          <div className="flex justify-center">
                            <div className="w-10 h-6 bg-rose-500 rounded-full flex items-center justify-end px-0.5 opacity-50 cursor-not-allowed">
                              <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                            </div>
                          </div>
                        </td>
                        {/* Admin toggle */}
                        <td className="text-center px-4 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => togglePermission('admin', key)}
                              className={cn(
                                "w-10 h-6 rounded-full flex items-center px-0.5 transition-all duration-200",
                                perms.admin[key] 
                                  ? "bg-indigo-500 justify-end" 
                                  : "bg-slate-200 justify-start"
                              )}
                            >
                              <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-all"></div>
                            </button>
                          </div>
                        </td>
                        {/* Staff toggle */}
                        <td className="text-center px-4 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => togglePermission('staff', key)}
                              className={cn(
                                "w-10 h-6 rounded-full flex items-center px-0.5 transition-all duration-200",
                                perms.staff[key] 
                                  ? "bg-emerald-500 justify-end" 
                                  : "bg-slate-200 justify-start"
                              )}
                            >
                              <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-all"></div>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
