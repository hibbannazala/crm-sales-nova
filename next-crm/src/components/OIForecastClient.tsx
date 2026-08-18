"use client";

import React, { useState } from 'react';
import { TrendingUp, Download, Calendar, DollarSign, Target, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OIForecastClient() {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  
  // Dummy data
  const stats = [
    { title: 'Target OI', value: 'Rp 500.000.000', icon: <Target className="w-6 h-6" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Actual OI', value: 'Rp 320.000.000', icon: <DollarSign className="w-6 h-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Gap / Shortfall', value: 'Rp 180.000.000', icon: <TrendingUp className="w-6 h-6" />, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const milestones = [
    { title: 'Pipeline (10%)', amount: 'Rp 1.000.000.000', deals: 45 },
    { title: 'Negotiation (50%)', amount: 'Rp 400.000.000', deals: 12 },
    { title: 'Closing (90%)', amount: 'Rp 200.000.000', deals: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <TrendingUp className="w-6 h-6 text-indigo-600" /> OI Forecasts
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Lacak dan proyeksikan target Order Intake bulanan Anda.</p>
        </div>
        <div className="flex gap-2">
           <input 
             type="month" 
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700"
           />
           <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 text-sm flex items-center gap-2">
             <Download className="w-4 h-4" /> Export
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", s.bg, s.color)}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.title}</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Milestone Breakdown */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Forecast berdasarkan Probability</h3>
          </div>
          <div className="p-8">
            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-200 transition-colors cursor-pointer group">
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">{m.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{m.deals} Deals di tahap ini</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-slate-900">{m.amount}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
