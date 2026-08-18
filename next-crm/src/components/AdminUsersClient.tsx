"use client";
import { useState } from 'react';
import { UserProfile } from '../types';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { UserCheck, Shield, UserX, Pencil, Check, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface AdminUsersProps {
  users: UserProfile[];
}

export default function AdminUsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const supabase = createClient();
  const router = useRouter();
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmVariant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmVariant: 'danger' | 'primary' = 'danger') => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, confirmVariant });
  };

  const approveUser = async (uid: string) => {
    try {
      await supabase.from('users').update({ role: 'staff' }).eq('id', uid);
      setUsers(users.map(u => u.id === uid ? { ...u, role: 'staff' } : u));
      router.refresh();
      toast.success("User disetujui sebagai Staff");
    } catch (error: any) {
      toast.error("Gagal: " + error.message);
    }
  };

  const updateName = async (uid: string) => {
    if (!newName.trim()) return;
    try {
      await supabase.from('users').update({ name: newName }).eq('id', uid);
      setUsers(users.map(u => u.id === uid ? { ...u, name: newName } : u));
      router.refresh();
      setEditingUid(null);
      toast.success("Nama berhasil diperbarui");
    } catch (error: any) {
      toast.error("Gagal: " + error.message);
    }
  };

  const makeAdmin = async (uid: string) => {
    showConfirm(
      "Promosi Admin",
      "Apakah Anda yakin ingin menjadikan user ini sebagai Admin? Admin memiliki akses luas ke sistem.",
      async () => {
        try {
          await supabase.from('users').update({ role: 'admin' }).eq('id', uid);
      setUsers(users.map(u => u.id === uid ? { ...u, role: 'admin' } : u));
      router.refresh();
          toast.success("User dipromosikan menjadi Admin");
        } catch (error: any) {
          toast.error("Gagal: " + error.message);
        }
      },
      'primary'
    );
  };

  const revokeAccess = async (uid: string) => {
    showConfirm(
      "Cabut Akses",
      "Apakah Anda yakin ingin mencabut akses user ini? Status akan kembali ke Pending dan user tidak bisa login.",
      async () => {
        try {
          await supabase.from('users').update({ role: 'pending' }).eq('id', uid);
      setUsers(users.map(u => u.id === uid ? { ...u, role: 'pending' } : u));
      router.refresh();
          toast.success("Akses dicabut");
        } catch (error: any) {
          toast.error("Gagal: " + error.message);
        }
      }
    );
  };

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8 space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-black text-gray-800">Manajemen User (Approval Akun)</h2>
        <p className="text-sm text-gray-500 mt-1">Berikan akses (Approve) kepada akun Google yang baru mendaftar agar bisa login ke sistem.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-bold">Nama Staff</th>
              <th className="px-4 py-4 font-bold">Email Google</th>
              <th className="px-4 py-4 font-bold text-center">Status / Role</th>
              <th className="px-4 py-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-800">
                  {editingUid === u.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="px-2 py-1 border rounded text-xs w-32"
                        autoFocus
                      />
                      <button onClick={() => updateName(u.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingUid(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      {u.name}
                      <button 
                        onClick={() => { setEditingUid(u.id); setNewName(u.name); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition p-1"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                    u.role === 'lord' ? 'bg-rose-100 text-rose-700' :
                    u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 
                    u.role === 'staff' ? 'bg-emerald-100 text-emerald-700' : 
                    'bg-yellow-100 text-yellow-700'
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {u.role === 'pending' ? (
                      <button 
                        onClick={() => approveUser(u.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" /> Approve Staff
                      </button>
                    ) : (
                      <>
                        {u.role !== 'admin' && u.role !== 'lord' && (
                          <button 
                            onClick={() => makeAdmin(u.id)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 flex items-center gap-1"
                          >
                            <Shield className="w-3 h-3" /> Jadikan Admin
                          </button>
                        )}
                        {u.role !== 'lord' && (
                          <button 
                            onClick={() => revokeAccess(u.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center gap-1"
                          >
                            <UserX className="w-3 h-3" /> Revoke
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmVariant={confirmConfig.confirmVariant}
      />
    </div>
  );
}
