"use client";
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { Lead, OIForecast, ProductOffered, UserProfile } from '../../types';
import { Plus, Trash2, CheckCircle2, CircleDashed, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import CurrencyInput from '../common/CurrencyInput';
import StatusModalClient from '../StatusModalClient';
import { useRouter } from 'next/navigation';

interface OIGridProps {
  forecasts: OIForecast[];
  selectedMonthYear: string;
  activeTab: ProductOffered;
  leads: Lead[];
  user: UserProfile;
  users: UserProfile[];
  onAddForecast: (forecast: OIForecast) => void;
  onUpdateForecast: (id: string, updates: Partial<OIForecast>) => void;
  onDeleteForecast: (id: string) => void;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatIDDate = (dateString: string) => {
  if (!dateString) return 'Pilih Tanggal';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Juni', 'Juli', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function OIGrid({ forecasts, selectedMonthYear, activeTab, leads, user, users, onAddForecast, onUpdateForecast, onDeleteForecast }: OIGridProps) {
  const supabase = createClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<Lead | null>(null);

  // Sorting forecasts: Base Case (100-80), Realistic (79-50), Worst Case (<50)
  const sortedForecasts = [...forecasts].sort((a, b) => b.successRate - a.successRate);

  const handleAddForecast = async () => {
    if (!selectedLeadId) {
      toast.error("Pilih Brand/Lead terlebih dahulu");
      return;
    }

    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    // Check if already exists
    if (forecasts.some(f => f.leadId === selectedLeadId)) {
      toast.error("Brand ini sudah ada di forecast bulan ini produk ini.");
      return;
    }

    const newForecast: Partial<OIForecast> = {
      leadId: lead.id,
      monthYear: selectedMonthYear,
      product: activeTab,
      value: lead.dealValue || 0,
      campaignNumber: (lead.funnelHistory?.filter((h: any) => h.stage === 'Close Win').length || 0) + 1,
      budgetAds: 0,
      budgetCreator: 0,
      grossMargin: lead.dealValue || 0,
      realMargin: 0,
      realPayment: 0,
      successRate: 50, // default
      status: 'OPEN',
      tier: '-',
      category: activeTab === 'TNT' ? 'TNT Campaign' : activeTab === 'HYPE' ? 'HYPE Campaign' : 'Custom Campaign',
      lastFollowUp: '',
      noteSales: '',
      dateQuotation: '',
      picQuotation: '',
      dateInvoice: '',
      picInvoice: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newForecastDb = {
      lead_id: newForecast.leadId,
      month_year: newForecast.monthYear,
      product: newForecast.product,
      value: newForecast.value,
      campaign_number: newForecast.campaignNumber,
      budget_ads: newForecast.budgetAds,
      budget_creator: newForecast.budgetCreator,
      gross_margin: newForecast.grossMargin,
      real_margin: newForecast.realMargin,
      real_payment: newForecast.realPayment,
      success_rate: newForecast.successRate,
      status: newForecast.status,
      tier: newForecast.tier,
      category: newForecast.category,
      last_follow_up: newForecast.lastFollowUp,
      note_sales: newForecast.noteSales,
      date_quotation: newForecast.dateQuotation,
      pic_quotation: newForecast.picQuotation,
      date_invoice: newForecast.dateInvoice,
      pic_invoice: newForecast.picInvoice,
      created_at: newForecast.createdAt,
      updated_at: newForecast.updatedAt,
    };

    try {
      const { data, error } = await supabase.from('oi_forecasts').insert([newForecastDb]).select().single();
      if (error) throw error;
      
      const mappedData = {
        ...newForecast,
        id: data.id
      };
      
      onAddForecast(mappedData as OIForecast);
      toast.success("Berhasil ditambahkan ke Forecast");
      setIsAdding(false);
      setSelectedLeadId('');
      setSearchTerm('');
      setShowDropdown(false);
    } catch (err: any) {
      toast.error("Gagal menambah: " + err.message);
    }
  };

  const handleUpdate = async (id: string, field: keyof OIForecast, value: any) => {
    try {
      const fieldMap: Record<string, string> = {
        monthYear: 'month_year',
        budgetAds: 'budget_ads',
        budgetCreator: 'budget_creator',
        grossMargin: 'gross_margin',
        realMargin: 'real_margin',
        realPayment: 'real_payment',
        targetGMV: 'target_gmv',
        targetCreator: 'target_creator',
        targetVideoAffiliate: 'target_video_affiliate',
        targetVideoInternal: 'target_video_internal',
        targetViews: 'target_views',
        successRate: 'success_rate',
        lastFollowUp: 'last_follow_up',
        noteSales: 'note_sales',
        dateQuotation: 'date_quotation',
        picQuotation: 'pic_quotation',
        dateInvoice: 'date_invoice',
        picInvoice: 'pic_invoice',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        leadId: 'lead_id'
      };
      
      const dbField = fieldMap[field] || field;
      const updates: any = { [dbField]: value, updated_at: new Date().toISOString() };
      
      // Auto calc gross margin if budgetAds or budgetCreator or value changes
      const current = forecasts.find(f => f.id === id);
      const mappedUpdates: Partial<OIForecast> = { [field]: value };
      
      if (current && (field === 'budgetAds' || field === 'budgetCreator' || field === 'value')) {
        const val = field === 'value' ? Number(value) : (current.value || 0);
        const ads = field === 'budgetAds' ? Number(value) : (current.budgetAds || 0);
        const creator = field === 'budgetCreator' ? Number(value) : (current.budgetCreator || 0);
        updates.gross_margin = val - ads - creator;
        mappedUpdates.grossMargin = val - ads - creator;
      }

      const { error } = await supabase.from('oi_forecasts').update(updates).eq('id', id);
      if (error) throw error;
      
      onUpdateForecast(id, mappedUpdates);

      // Status cross-sync with Lead
      if (current && field === 'status' && value === 'WIN') {
        await supabase.from('leads').update({
          status: 'Close Win',
          dateClosed: new Date().toISOString()
        }).eq('id', current.leadId);
      }

    } catch (err: any) {
      toast.error("Gagal update: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Keluarkan data ini dari Forecast?")) return;
    try {
      const { error } = await supabase.from('oi_forecasts').delete().eq('id', id);
      if (error) throw error;
      onDeleteForecast(id);
      toast.success("Data dihapus");
    } catch (error: any) {
      toast.error("Gagal hapus: " + error.message);
    }
  };

  const getScenarioInfo = (rate: number) => {
    if (rate >= 80) return { name: "Base Case (80-100%)", color: "bg-emerald-500 text-white", border: "border-emerald-500" };
    if (rate >= 50) return { name: "Realistic (50-79%)", color: "bg-lime-500 text-white", border: "border-lime-500" };
    return { name: "Worst Case (<50%)", color: "bg-rose-500 text-white", border: "border-rose-500" };
  };

  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden min-h-0">
      {/* TOOLBAR */}
      <div className="shrink-0 p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 text-indigo-700 font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-widest">
            {activeTab} Data Grid
          </div>
          <span className="text-sm font-bold text-slate-400">|</span>
          <span className="text-sm font-bold text-slate-600">{forecasts.length} Brands Forecasted</span>
        </div>
        
        {isAdding ? (
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <input 
                type="text"
                placeholder="Ketik nama Brand..."
                className="bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 w-64 outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if(!e.target.value) setSelectedLeadId('');
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 divide-y divide-slate-100">
                  {leads.filter(l => l.brandName && l.brandName.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 15).length > 0 ? (
                    leads.filter(l => l.brandName && l.brandName.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 15).map(l => (
                      <div 
                        key={l.id} 
                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${selectedLeadId === l.id ? 'bg-indigo-100 font-bold text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                        onClick={() => {
                          setSelectedLeadId(l.id);
                          setSearchTerm(l.brandName + (l.contact ? ` - ${l.contact}` : ''));
                          setShowDropdown(false);
                        }}
                      >
                        {l.brandName} <span className="text-xs text-slate-400 block">{l.contact || 'No PIC'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-400 italic">Brand tidak ditemukan...</div>
                  )}
                </div>
              )}
            </div>
            
            <button onClick={handleAddForecast} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              Simpan
            </button>
            <button onClick={() => {
              setIsAdding(false);
              setSearchTerm('');
              setSelectedLeadId('');
              setShowDropdown(false);
            }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              Batal
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-black transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Brand ke Forecast
          </button>
        )}
      </div>

      {/* SPREADSHEET TABLE DIV */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max text-sm">
          <thead className="sticky top-0 bg-slate-100 shadow-sm z-20">
            <tr>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest w-12 text-center">Act</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest w-32">Scenario</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-900 uppercase tracking-widest min-w-[150px]">Brand Name</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-indigo-700 uppercase tracking-widest bg-indigo-50/50 w-20">Camp. Ke</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-900 uppercase tracking-widest bg-emerald-50">Value</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-rose-700 uppercase tracking-widest bg-rose-50/50">B. Ads</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-rose-700 uppercase tracking-widest bg-rose-50/50">B. Creator</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-emerald-700 uppercase tracking-widest bg-emerald-100/50">Gross Margin</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-amber-900 uppercase tracking-widest bg-amber-50">Real Payment</th>
              
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-blue-900 uppercase tracking-widest bg-blue-50 border-l-[3px] border-l-blue-200">T. GMV</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-blue-900 uppercase tracking-widest bg-blue-50">T. Creator</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-blue-900 uppercase tracking-widest bg-blue-50">T. Vid Aff</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-blue-900 uppercase tracking-widest bg-blue-50 border-r-[3px] border-r-blue-200">T. Vid Int</th>
              
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest w-20">Success %</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest w-32">Status</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest w-20">Tier</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest w-40">Category</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-purple-700 uppercase tracking-widest bg-purple-50">Quotation</th>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-black text-[10px] text-purple-700 uppercase tracking-widest bg-purple-50">Invoice</th>
              <th className="px-4 py-3 border-b border-slate-200 font-black text-[10px] text-slate-500 uppercase tracking-widest">Internal Update</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {sortedForecasts.length === 0 ? (
              <tr>
                <td colSpan={19} className="px-4 py-12 text-center text-slate-400 font-medium">
                  Belum ada data forecast untuk bulan ini pada produk {activeTab}.
                </td>
              </tr>
            ) : (
              sortedForecasts.map(f => {
                const lead = leads.find(l => l.id === f.leadId);
                const brandName = lead ? lead.brandName : 'Unknown Brand';
                const scenario = getScenarioInfo(f.successRate || 0);

                return (
                  <tr key={f.id} className="hover:bg-slate-50/80 group border-b border-slate-100">
                    <td className="px-2 py-2 border-r border-slate-100 text-center">
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className={`px-2 py-2 border-r border-slate-100 text-center`}>
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${scenario.color} shadow-sm`}>
                        {scenario.name.split(' (')[0]}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-r border-slate-100 font-black text-slate-700">{brandName}</td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-indigo-50/20">
                      <input 
                        type="number"
                        min="1"
                        value={f.campaignNumber || ''}
                        onChange={(e) => handleUpdate(f.id, 'campaignNumber', Number(e.target.value))}
                        className="w-full text-center bg-transparent focus:bg-white focus:ring-1 ring-indigo-500 rounded p-1 font-black text-indigo-700 text-sm outline-none"
                        placeholder="1"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-emerald-50/30">
                      <CurrencyInput 
                        value={f.value || 0} 
                        onChange={(val) => handleUpdate(f.id, 'value', val)}
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none font-bold text-slate-700 min-w-[140px]" 
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-rose-50/10">
                      <CurrencyInput 
                        value={f.budgetAds || 0} 
                        onChange={(val) => handleUpdate(f.id, 'budgetAds', val)}
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-slate-600 min-w-[130px]" 
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-rose-50/10">
                      <CurrencyInput 
                        value={f.budgetCreator || 0} 
                        onChange={(val) => handleUpdate(f.id, 'budgetCreator', val)}
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-slate-600 min-w-[130px]" 
                      />
                    </td>
                    <td className="px-4 py-2 border-r border-slate-100 bg-emerald-50/30 font-black text-emerald-700">
                      {formatMoney(f.grossMargin || 0)}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-amber-50/30">
                      <CurrencyInput 
                        value={f.realPayment || 0} 
                        onChange={(val) => handleUpdate(f.id, 'realPayment', val)}
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none font-bold text-amber-700 min-w-[140px]" 
                      />
                    </td>

                    {/* TARGETS */}
                    <td className="px-2 py-2 border-r border-slate-100 bg-blue-50/30 border-l-[3px] border-l-blue-100">
                      <CurrencyInput prefix="" placeholder="GMV" value={f.targetGMV || 0} onChange={(val) => handleUpdate(f.id, 'targetGMV', val)} className="w-full min-w-[130px] bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-blue-800 font-semibold" />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-blue-50/30">
                      <input type="number" placeholder="KOC" value={f.targetCreator || ''} onChange={(e) => handleUpdate(f.id, 'targetCreator', Number(e.target.value))} className="w-[60px] bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-blue-800 font-semibold" />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-blue-50/30">
                      <input type="number" placeholder="Vid Aff" value={f.targetVideoAffiliate || ''} onChange={(e) => handleUpdate(f.id, 'targetVideoAffiliate', Number(e.target.value))} className="w-[60px] bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-blue-800 font-semibold" />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-blue-50/30 border-r-[3px] border-r-blue-100">
                      <input type="number" placeholder="Vid Int" value={f.targetVideoInternal || ''} onChange={(e) => handleUpdate(f.id, 'targetVideoInternal', Number(e.target.value))} className="w-[60px] bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-blue-800 font-semibold" />
                    </td>

                    <td className="px-2 py-2 border-r border-slate-100">
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          max="100" min="0"
                          value={f.successRate || 0} 
                          onChange={(e) => handleUpdate(f.id, 'successRate', Number(e.target.value))}
                          className="w-12 bg-transparent border border-transparent focus:border-indigo-300 px-1 py-1 rounded outline-none text-center font-black" 
                        />
                        <span className="text-slate-400 font-black text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100">
                      <button 
                        onClick={() => lead && setSelectedLeadForStatus(lead)}
                        disabled={!lead}
                        className={`w-full text-[10px] font-black p-1.5 rounded outline-none cursor-pointer tracking-widest text-center transition hover:opacity-80 disabled:opacity-50 ${
                          f.status === 'WIN' ? 'bg-emerald-100 text-emerald-700' : 
                          f.status === 'LOSE' ? 'bg-rose-100 text-rose-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {f.status}
                      </button>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100">
                      <select 
                        value={f.tier || '-'} 
                        onChange={(e) => handleUpdate(f.id, 'tier', e.target.value)}
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-1 p-1.5 rounded outline-none text-slate-700 font-bold"
                      >
                        <option value="-">-</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100">
                      <input 
                        type="text" 
                        value={f.category || ''} 
                        onChange={(e) => handleUpdate(f.id, 'category', e.target.value)}
                        placeholder="Ketik kategori..."
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-slate-600 text-xs" 
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-purple-50/20">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="relative w-full">
                          <div className={`w-full bg-white border border-slate-200 px-2 py-1.5 rounded text-center font-bold text-[11px] ${f.dateQuotation ? 'text-purple-900' : 'text-slate-400'}`}>
                            {formatIDDate(f.dateQuotation || '')}
                          </div>
                          <input 
                            type="date" 
                            value={f.dateQuotation || ''} 
                            onChange={(e) => handleUpdate(f.id, 'dateQuotation', e.target.value)}
                            onClick={(e) => { try { e.currentTarget.showPicker() } catch(err) {} }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            title="Tanggal Kirim Quotation"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={f.picQuotation || ''} 
                          onChange={(e) => handleUpdate(f.id, 'picQuotation', e.target.value)}
                          placeholder="+ Nama PIC"
                          className="w-full bg-purple-100 hover:bg-purple-200 focus:bg-purple-200 focus:ring-2 focus:ring-purple-300 border-none px-3 py-1 rounded-full outline-none text-purple-700 font-black text-center text-[10px] tracking-wider uppercase placeholder-purple-400/70 transition-all shadow-sm" 
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-100 bg-purple-50/20">
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="relative w-full">
                          <div className={`w-full bg-white border border-slate-200 px-2 py-1.5 rounded text-center font-bold text-[11px] ${f.dateInvoice ? 'text-purple-900' : 'text-slate-400'}`}>
                            {formatIDDate(f.dateInvoice || '')}
                          </div>
                          <input 
                            type="date" 
                            value={f.dateInvoice || ''} 
                            onChange={(e) => handleUpdate(f.id, 'dateInvoice', e.target.value)}
                            onClick={(e) => { try { e.currentTarget.showPicker() } catch(err) {} }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            title="Tanggal Kirim Invoice"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={f.picInvoice || ''} 
                          onChange={(e) => handleUpdate(f.id, 'picInvoice', e.target.value)}
                          placeholder="+ Nama PIC"
                          className="w-full bg-fuchsia-100 hover:bg-fuchsia-200 focus:bg-fuchsia-200 focus:ring-2 focus:ring-fuchsia-300 border-none px-3 py-1 rounded-full outline-none text-fuchsia-700 font-black text-center text-[10px] tracking-wider uppercase placeholder-fuchsia-400/70 transition-all shadow-sm" 
                        />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input 
                        type="text" 
                        value={f.noteSales || ''} 
                        onChange={(e) => handleUpdate(f.id, 'noteSales', e.target.value)}
                        placeholder="Internal notes..."
                        className="w-full bg-transparent border border-transparent focus:border-indigo-300 px-2 py-1 rounded outline-none text-slate-600 text-xs italic" 
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

      </div>

      {selectedLeadForStatus && (
        <StatusModalClient
          isOpen={true}
          lead={selectedLeadForStatus}
          user={user}
          users={users}
          onClose={() => setSelectedLeadForStatus(null)}
        />
      )}
    </div>
  );
}
