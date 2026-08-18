"use client";
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { Lead, OIForecast, OITarget, UserProfile, ProductOffered } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, CalendarDays, Plus } from 'lucide-react';
import OISummaryCards from './OIForecast/OISummaryCards';
import OIGrid from './OIForecast/OIGrid';
import OIMilestone from './OIForecast/OIMilestone';
import { toast } from 'sonner';

interface OIForecastPageProps {
  leads: Lead[];
  user: UserProfile;
  users?: UserProfile[];
  forecasts: any[];
  targets: any[];
}
export default function OIForecastPage({ leads, user, users = [], forecasts: serverForecasts, targets: serverTargets }: OIForecastPageProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<ProductOffered>('TNT');
  const [activeView, setActiveView] = useState<'forecast' | 'milestones'>('forecast');
  
  // Filters
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPIC, setSelectedPIC] = useState<string>('All');
  
  const forecasts = serverForecasts || [];
  const targets = serverTargets || [];
  const loading = false;

  // Fetch Forecasts and Targets based on active view to optimize reads
  

  // Auto-sync Forecasts from Leads
  useEffect(() => {
    if (!leads.length || !forecasts.length) return;

    // Use a small timeout to avoid syncing during intense renders
    const syncTimer = setTimeout(() => {
      forecasts.forEach(f => {
        const lead = leads.find(l => l.id === f.leadId && !l.isDeleted);
        if (!lead) return;

        let needsUpdate = false;
        const updates: any = {};
        
        const fCamp = f.campaignNumber || 1;
        const matchingWin = lead.funnelHistory?.find((h: any) => h.stage === 'Close Win' && (h.campaignNumber || 1) === fCamp);

        if (matchingWin) {
          // Sync WIN precisely for this campaign
          if (f.status !== 'WIN') {
            updates.status = 'WIN';
            needsUpdate = true;
          }
          if (matchingWin.dealValue !== undefined && f.value !== matchingWin.dealValue) {
            updates.value = matchingWin.dealValue;
            updates.grossMargin = matchingWin.dealValue - (f.budgetAds || 0) - (f.budgetCreator || 0);
            needsUpdate = true;
          }
        } else {
          // If no matching win...
          if (f.status === 'WIN') {
            // It was won, but the win history was deleted/changed! Revert to OPEN.
            updates.status = 'OPEN';
            needsUpdate = true;
          } else if ((lead.status === 'Close Lost' || lead.status === 'Failed') && f.status !== 'LOSE') {
            updates.status = 'LOSE';
            needsUpdate = true;
          } else if (lead.status !== 'Close Lost' && lead.status !== 'Failed' && f.status === 'LOSE') {
            // Re-opened lead
            updates.status = 'OPEN';
            needsUpdate = true;
          }
          
          // Optionally sync global value if it's OPEN and has no match but global value exists?
          // No, usually OPEN forecasts rely on manual value input for target projections.
        }

        if (needsUpdate) {
          // Fire update to firestore implicitly
          supabase.from('oi_forecasts').update({
            ...updates,
            updatedAt: new Date().toISOString()
          }).eq('id', f.id);
        }
      });
    }, 1000);

    return () => clearTimeout(syncTimer);
  }, [forecasts, leads]);

  const getForecastPIC = (f: OIForecast) => {
    const lead = leads.find(l => l.id === f.leadId);
    if (!lead || !lead.funnelHistory || lead.funnelHistory.length === 0) return 'Unknown';
    // Identify who updated to Win/Lost
    const winOrLost = lead.funnelHistory.slice().reverse().find((h: any) => h.stage === 'Close Win' || h.stage === 'Close Lost');
    if (winOrLost) return winOrLost.by;
    // Default to last updater
    return lead.funnelHistory[lead.funnelHistory.length - 1].by || 'Unknown';
  };

  const filteredForecasts = forecasts.filter(f => {
    if (f.monthYear !== selectedMonthYear || f.product !== activeTab) return false;
    if (selectedPIC !== 'All') {
      return getForecastPIC(f) === selectedPIC;
    }
    return true;
  });

  const currentTarget = targets.find(t => t.monthYear === selectedMonthYear && t.product === activeTab);
  
  const uniquePICs = Array.from(new Set(forecasts.map(getForecastPIC))).filter(Boolean).sort();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden h-full">
      {/* HEADER */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-8 py-6 z-10 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg border border-indigo-400/20 text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">OI Forecast</h1>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
              Pipeline financial projections and deal conversions. Data auto-syncs with original leads.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/60 shadow-inner">
              <button
                onClick={() => setActiveView('forecast')}
                className={`flex flex-col items-center justify-center h-16 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                  activeView === 'forecast' ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingUp className="w-5 h-5 mb-1" />
                <span>Forecast</span>
              </button>
              <button
                onClick={() => setActiveView('milestones')}
                className={`flex flex-col items-center justify-center h-16 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                  activeView === 'milestones' ? 'bg-white text-emerald-600 shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Target className="w-5 h-5 mb-1" />
                <span>Milestones</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS & FILTERS */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('TNT')}
              className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-sm ${
                activeTab === 'TNT' 
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/30' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              TNT Campaign
            </button>
            <button
              onClick={() => setActiveTab('Basemen')}
              className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-sm ${
                activeTab === 'Basemen' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Basemen
            </button>
            <button
              onClick={() => setActiveTab('HYPE')}
              className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-sm ${
                activeTab === 'HYPE' 
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-amber-500/30' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              HYPE
            </button>
          </div>

          {activeView === 'forecast' && (
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                <select 
                  value={selectedPIC} 
                  onChange={(e) => setSelectedPIC(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pl-2 pr-1"
                >
                  <option value="All">Semua PIC</option>
                  {uniquePICs.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <CalendarDays className="w-5 h-5 text-slate-400 ml-2" />
                <input 
                  type="month" 
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="bg-slate-50 border-none rounded-xl text-sm font-black text-slate-700 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeView}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full lg:h-full flex flex-col"
          >
            {activeView === 'forecast' ? (
              <div className="flex-1 flex flex-col lg:h-full lg:overflow-hidden p-4 lg:p-6 space-y-6 min-h-0">
                <OISummaryCards 
                  forecasts={filteredForecasts} 
                  target={currentTarget?.targetValue || 0} 
                  activeTab={activeTab} 
                />
                <OIGrid 
                  forecasts={filteredForecasts} 
                  selectedMonthYear={selectedMonthYear} 
                  activeTab={activeTab} 
                  leads={leads}
                  user={user}
                  users={users}
                />
              </div>
            ) : (
              <div className="flex-1 lg:overflow-hidden p-4 lg:p-6">
                <OIMilestone 
                  forecasts={forecasts} 
                  targets={targets} 
                  activeTab={activeTab} 
                  user={user}
                  leads={leads}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
