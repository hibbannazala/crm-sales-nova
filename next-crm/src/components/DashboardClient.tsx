'use client'

import React, { useState, useEffect } from 'react';
import { Filter, Search, TrendingUp, Users, Target, Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardStats {
  total: number;
  chated: number;
  responsed: number;
  meeting: number;
  win: number;
  lost: number;
  revenue: number;
}

interface DashboardClientProps {
  stats: DashboardStats;
  admins: string[];
  categories: string[];
}

export default function DashboardClient({ stats, admins, categories }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterAdmin, setFilterAdmin] = useState(searchParams.get('admin') || 'ALL');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || 'ALL');
  const [filterStart, setFilterStart] = useState(searchParams.get('start') || '');
  const [filterEnd, setFilterEnd] = useState(searchParams.get('end') || '');

  // Update URL whenever filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filterAdmin && filterAdmin !== 'ALL') params.set('admin', filterAdmin);
    else params.delete('admin');

    if (filterCategory && filterCategory !== 'ALL') params.set('category', filterCategory);
    else params.delete('category');

    if (filterStart) params.set('start', filterStart);
    else params.delete('start');

    if (filterEnd) params.set('end', filterEnd);
    else params.delete('end');

    router.push(`/?${params.toString()}`, { scroll: false });
  }, [filterAdmin, filterCategory, filterStart, filterEnd, router, searchParams]);

  return (
    <div className="flex flex-col h-full">
      {/* Filters Area */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Ringkasan performa penjualan berdasarkan filter.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
            value={filterAdmin}
            onChange={(e) => setFilterAdmin(e.target.value)}
          >
            <option value="ALL">Semua Tim Sales</option>
            {admins.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select 
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-indigo-500 transition">
             <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
             <input 
               type="date" 
               className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700"
               value={filterStart}
               onChange={(e) => setFilterStart(e.target.value)}
             />
          </div>
          
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus-within:border-indigo-500 transition">
             <span className="text-slate-400 mr-2 text-sm font-bold">SD</span>
             <input 
               type="date" 
               className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700"
               value={filterEnd}
               onChange={(e) => setFilterEnd(e.target.value)}
             />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat Cards */}
          <div className="crm-card p-5 border-l-4 border-indigo-500">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Leads</p>
             <h3 className="text-3xl font-black text-slate-800">{stats.total.toLocaleString('id-ID')}</h3>
          </div>
          <div className="crm-card p-5 border-l-4 border-amber-500">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Chated</p>
             <h3 className="text-3xl font-black text-slate-800">{stats.chated.toLocaleString('id-ID')}</h3>
          </div>
          <div className="crm-card p-5 border-l-4 border-blue-500">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Responsed</p>
             <h3 className="text-3xl font-black text-slate-800">{stats.responsed.toLocaleString('id-ID')}</h3>
          </div>
          <div className="crm-card p-5 border-l-4 border-emerald-500">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Close Win</p>
             <h3 className="text-3xl font-black text-slate-800">{stats.win.toLocaleString('id-ID')}</h3>
          </div>
          <div className="crm-card p-5 border-l-4 border-red-500">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Close Lost</p>
             <h3 className="text-3xl font-black text-slate-800">{stats.lost.toLocaleString('id-ID')}</h3>
          </div>
          <div className="crm-card p-5 border-l-4 border-purple-500 md:col-span-3">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Revenue (Omset)</p>
             <h3 className="text-3xl font-black text-slate-800">
               Rp {stats.revenue.toLocaleString('id-ID')}
             </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
           <Target className="w-16 h-16 text-slate-200 mb-4" />
           <h2 className="text-xl font-black text-slate-800 mb-2">Target & Grafik</h2>
           <p className="text-slate-500 font-medium text-center max-w-md">
             Komponen grafik Target Global dan Target Individu akan dimuat di sini menggunakan Server Components untuk performa kilat.
           </p>
        </div>
      </div>
    </div>
  );
}
