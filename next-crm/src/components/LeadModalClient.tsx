import React, { useState, useEffect } from 'react';
import { Lead, UserProfile, ProductOffered, LEAD_SOURCES } from '@/types';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';
import CurrencyInput from './common/CurrencyInput';
import { useCategories } from '@/hooks/useCategories';


interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  user: UserProfile;
  leads?: Lead[];
}


export default function LeadModalClient({ isOpen, onClose, lead, user, leads = [] }: LeadModalProps) {
  const { categories: CATEGORIES, addCategory } = useCategories();
  const [formData, setFormData] = useState({
    dateInput: new Date().toISOString().split('T')[0],
    category: '',
    brandName: '',
    contact: '',
    email: '',
    actionPlan: '',
    dealValue: 0,
    leadSource: '',
    customSource: '',
    customCategory: '',
    dateChated: '',
    dateResponsed: '',
    dateSetMeeting: '',
    dateClosed: '',
    campaignNumber: 1
  });
  const [productOffered, setProductOffered] = useState<ProductOffered[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const mapLeadToSupabase = (leadData: any) => {
    const mapped: any = { ...leadData };
    if (mapped.brandName !== undefined) { mapped.brand_name = mapped.brandName; delete mapped.brandName; }
    if (mapped.dateInput !== undefined) { mapped.date_input = mapped.dateInput; delete mapped.dateInput; }
    if (mapped.dateChated !== undefined) { mapped.date_chated = mapped.dateChated; delete mapped.dateChated; }
    if (mapped.dateResponsed !== undefined) { mapped.date_responsed = mapped.dateResponsed; delete mapped.dateResponsed; }
    if (mapped.dateSetMeeting !== undefined) { mapped.date_set_meeting = mapped.dateSetMeeting; delete mapped.dateSetMeeting; }
    if (mapped.dateClosed !== undefined) { mapped.date_closed = mapped.dateClosed; delete mapped.dateClosed; }
    if (mapped.dateFailed !== undefined) { mapped.date_failed = mapped.dateFailed; delete mapped.dateFailed; }
    if (mapped.interestLevel !== undefined) { mapped.interest_level = mapped.interestLevel; delete mapped.interestLevel; }
    if (mapped.dealValue !== undefined) { mapped.deal_value = mapped.dealValue; delete mapped.dealValue; }
    if (mapped.campaignNumber !== undefined) { mapped.campaign_number = mapped.campaignNumber; delete mapped.campaignNumber; }
    if (mapped.leadSource !== undefined) { mapped.lead_source = mapped.leadSource; delete mapped.leadSource; }
    if (mapped.actionPlan !== undefined) { mapped.action_plan = mapped.actionPlan; delete mapped.actionPlan; }
    if (mapped.productOffered !== undefined) { mapped.product_offered = mapped.productOffered; delete mapped.productOffered; }
    if (mapped.funnelHistory !== undefined) { mapped.funnel_history = mapped.funnelHistory; delete mapped.funnelHistory; }
    if (mapped.ownerId !== undefined) { mapped.owner_id = mapped.ownerId; delete mapped.ownerId; }
    if (mapped.isDeleted !== undefined) { mapped.is_deleted = mapped.isDeleted; delete mapped.isDeleted; }
    if (mapped.createdAt !== undefined) { mapped.created_at = mapped.createdAt; delete mapped.createdAt; }
    if (mapped.updatedAt !== undefined) { mapped.updated_at = mapped.updatedAt; delete mapped.updatedAt; }
    return mapped;
  };
  const [duplicateConfirm, setDuplicateConfirm] = useState<{isOpen: boolean, existingLead: any} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [internalLead, setInternalLead] = useState<Lead | null>(lead || null);
  const [smartMatch, setSmartMatch] = useState<Lead | null>(null);

  useEffect(() => {
    setInternalLead(lead);
  }, [lead, isOpen]);

  useEffect(() => {
    if (!lead && formData.brandName.trim().length > 1) {
      const searchName = formData.brandName.trim().toLowerCase();
      const existingData = leads.find(l => l.brandName?.trim().toLowerCase() === searchName);
      setSmartMatch(existingData || null);
    } else {
      setSmartMatch(null);
    }
  }, [formData.brandName, lead, leads]);

  const handleLoadSmartMatch = () => {
    if (smartMatch) {
      setInternalLead(smartMatch);
      setSmartMatch(null);
      toast.success("Data berhasil dimuat. Form otomatis beralih ke Mode Edit!");
    }
  };

  useEffect(() => {
    setErrors({});
    if (internalLead) {
      setFormData({
        dateInput: internalLead.dateInput,
        category: CATEGORIES.includes(internalLead.category) ? internalLead.category : (internalLead.category ? 'Tambah Baru' : ''),
        customCategory: CATEGORIES.includes(internalLead.category) ? '' : (internalLead.category || ''),
        brandName: internalLead.brandName,
        contact: internalLead.contact,
        email: internalLead.email || '',
        actionPlan: internalLead.actionPlan || '',
        dealValue: internalLead.dealValue || 0,
        leadSource: LEAD_SOURCES.includes(internalLead.leadSource || '') ? (internalLead.leadSource || '') : (internalLead.leadSource ? 'Tambah Baru' : ''),
        customSource: LEAD_SOURCES.includes(internalLead.leadSource || '') ? '' : (internalLead.leadSource || ''),
        dateChated: internalLead.dateChated || '',
        dateResponsed: internalLead.dateResponsed || '',
        dateSetMeeting: internalLead.dateSetMeeting || '',
        dateClosed: internalLead.dateClosed || '',
        campaignNumber: 1
      });
      setProductOffered(internalLead.productOffered || []);
    } else {
      setFormData({
        dateInput: new Date().toISOString().split('T')[0],
        category: '',
        customCategory: '',
        brandName: '',
        contact: '',
        email: '',
        actionPlan: '',
        dealValue: 0,
        leadSource: '',
        customSource: '',
        dateChated: '',
        dateResponsed: '',
        dateSetMeeting: '',
        dateClosed: '',
        campaignNumber: 1
      });
      setProductOffered([]);
    }
  }, [internalLead, isOpen]);

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'dateInput' && !value) {
      error = "Tanggal input harus diisi";
    } else if (name === 'category' && !value) {
      error = "Kategori harus dipilih";
    } else if (name === 'brandName') {
      if (!value.trim()) error = "Nama brand harus diisi";
      else if (value.trim().length < 2) error = "Nama brand minimal 2 karakter";
    } else if (name === 'contact') {
      const cleanValue = value.replace(/[^0-9+]/g, '');
      if (!cleanValue) error = "Nomor kontak harus diisi";
      else if (cleanValue.length < 7 || cleanValue.length > 20) error = "Format nomor tidak valid (7-20 digit angka)";
    } else if (name === 'picPhone' && value) {
      const cleanValue = value.replace(/[^0-9+]/g, '');
      if (cleanValue.length < 7 || cleanValue.length > 20) error = "Format nomor tidak valid (7-20 digit angka)";
    } else if (name === 'socialMedia' && value) {
      if (value.length > 0 && !value.includes('@') && !value.includes('http')) {
        error = "Gunakan format @username atau link profil";
      }
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // Auto sanitize contact number to only allow digits and +
    // This removes invisible characters usually present when copy-pasting from WA Business
    if (name === 'contact') {
      value = value.replace(/[^0-9+]/g, '');
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    let isValid = true;
    const results = Object.keys(formData).map(key => validateField(key, (formData as any)[key]));
    if (!results.every(r => r)) isValid = false;

    if (formData.category === 'Tambah Baru' && !formData.customCategory.trim()) {
      setErrors(prev => ({ ...prev, customCategory: 'Kategori baru harus diisi' }));
      isValid = false;
    }
    if (formData.leadSource === 'Tambah Baru' && !formData.customSource.trim()) {
      setErrors(prev => ({ ...prev, customSource: 'Sumber baru harus diisi' }));
      isValid = false;
    }

    if (formData.dateClosed && (!formData.dateSetMeeting || !formData.dateResponsed || !formData.dateChated)) {
      toast.error("Jika Close Win diisi, maka Tgl Meeting, Responsed, dan Chated wajib diisi!");
      isValid = false;
    } else if (formData.dateSetMeeting && (!formData.dateResponsed || !formData.dateChated)) {
      toast.error("Jika Tgl Meeting diisi, maka Tgl Responsed dan Chated wajib diisi!");
      isValid = false;
    } else if (formData.dateResponsed && !formData.dateChated) {
      toast.error("Jika Tgl Responsed diisi, maka Tgl Chated wajib diisi!");
      isValid = false;
    }

    // Chronological Waktu Safeguard
    if (formData.dateChated && formData.dateResponsed) {
      if (new Date(formData.dateResponsed).getTime() < new Date(formData.dateChated).getTime()) {
        toast.error("Logika Waktu Salah: Tgl Responsed tidak boleh mundur dari Tgl Chated!");
        isValid = false;
      }
    }
    if (formData.dateResponsed && formData.dateSetMeeting) {
      if (new Date(formData.dateSetMeeting).getTime() < new Date(formData.dateResponsed).getTime()) {
        toast.error("Logika Waktu Salah: Tgl Meeting tidak boleh mundur dari Tgl Responsed!");
        isValid = false;
      }
    }
    if (formData.dateSetMeeting && formData.dateClosed) {
      if (new Date(formData.dateClosed).getTime() < new Date(formData.dateSetMeeting).getTime()) {
        toast.error("Logika Waktu Salah: Tgl Close Win tidak boleh mundur dari Tgl Meeting!");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Mohon perbaiki kesalahan pada form");
      return;
    }

    setLoading(true);

    try {
      const finalCategory = formData.category === 'Tambah Baru' ? formData.customCategory.trim() : formData.category;
      const finalSource = formData.leadSource === 'Tambah Baru' ? formData.customSource.trim() : formData.leadSource;
      
      const payloadToSave = { ...formData, category: finalCategory, leadSource: finalSource };
      delete (payloadToSave as any).customCategory;
      delete (payloadToSave as any).customSource;

      if (internalLead) {
        if (user.role === 'staff') {
          const isMasterDataChanged = internalLead.brandName !== formData.brandName || internalLead.contact !== formData.contact;
          if (isMasterDataChanged) {
            await supabase.from("edit_requests").insert({
              lead_id: internalLead.id,
              old_brand: internalLead.brandName,
              new_brand: formData.brandName,
              old_contact: internalLead.contact,
              new_contact: formData.contact,
              requested_by: user.name,
              timestamp: new Date().toISOString(),
              status: 'pending'
            });
            await supabase.from('leads').update(mapLeadToSupabase({
              dateInput: formData.dateInput,
              category: finalCategory,
              actionPlan: formData.actionPlan
            })).eq('id', internalLead.id);
            toast.info("Permohonan edit terkirim ke Admin");
          } else {
            await supabase.from('leads').update(mapLeadToSupabase(payloadToSave)).eq('id', internalLead.id);
            toast.success("Lead diperbarui");
          }
        } else {
          const changes = [];
          if (internalLead.brandName !== formData.brandName) changes.push(`Brand: ${internalLead.brandName} -> ${formData.brandName}`);
          if (internalLead.contact !== formData.contact) changes.push(`WA: ${internalLead.contact} -> ${formData.contact}`);
          if (internalLead.category !== finalCategory) changes.push(`Kategori: ${internalLead.category} -> ${finalCategory}`);
          if (internalLead.dateInput !== formData.dateInput) changes.push(`Tgl: ${internalLead.dateInput} -> ${formData.dateInput}`);

          if (changes.length > 0) {
            const { error: noteErr } = await supabase.from('lead_notes').insert({
              lead_id: internalLead.id,
              text: `[SYSTEM] Data diperbarui oleh ${user.name}. ${changes.join(', ')}`,
              author_name: 'System',
              is_log: true,
              note_type: 'note',
              created_at: new Date().toISOString()
            });
            if (noteErr) throw noteErr;
          }

          const { error: updateErr } = await supabase.from('leads').update(mapLeadToSupabase({ ...payloadToSave, productOffered, updatedAt: new Date().toISOString() })).eq('id', internalLead.id);
          if (updateErr) throw updateErr;

          // --- Sync with OI Forecast ---
          try {
            const { data: forecastSnap } = await supabase.from('oi_forecasts').select('*').eq('is_deleted', false);
            if (forecastSnap && forecastSnap.length > 0) {
              const currentStatus = (payloadToSave as any).status || internalLead?.status || 'Leads';
              const forecastStatus = currentStatus === 'Close Win' ? 'WIN' : (currentStatus === 'Close Lost' || currentStatus === 'Failed' ? 'LOSE' : 'OPEN');
              const targetBrand = (formData.brandName || "").trim().toLowerCase();
              
              for (const fData of forecastSnap) {
                
                const fBrand = (fData.brand_name || "").trim().toLowerCase();
                
                // Match Brand
                if (fBrand !== targetBrand) continue;

                const fCategory = fData.category || '';
                
                // Match by product
                const isProductMatch = (productOffered || []).some(p => 
                  fCategory.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(fCategory.toLowerCase().replace(' campaign', '').trim())
                );

                if (isProductMatch) {
                  const fCampaign = Number(fData.campaign_number || 1);
                  // For existing lead, we check the latest win campaign number
                  const lCampaign = Number(internalLead?.funnelHistory?.filter(h => h.stage === 'Close Win').pop()?.campaignNumber || 1);

                  if (fCampaign === lCampaign || (forecastStatus === 'OPEN')) {
                    await supabase.from('oi_forecasts').update({ status: forecastStatus, updated_at: new Date().toISOString() }).eq('id', fData.id);
                  }
                }
              }
            }
          } catch (fErr) {
            console.error("Forecast sync failed:", fErr);
          }

          // Register new category to global list if needed
          if (formData.category === 'Tambah Baru' && formData.customCategory.trim()) {
            await addCategory(formData.customCategory.trim());
          }
          toast.success("Lead diperbarui");
        }
      } else {
        const searchName = formData.brandName.trim().toLowerCase();
        const existingData = leads.find(l => l.brandName?.trim().toLowerCase() === searchName);
        
        if (existingData) {
          if (existingData.contact === formData.contact) {
            setLoading(false);
            toast.error("Data lead ini sudah pernah diinput sebelumnya (Brand & WA Sama)!");
            return;
          } else {
            setLoading(false);
            setDuplicateConfirm({ isOpen: true, existingLead: existingData });
            return;
          }
        }

        let finalStatus = 'Leads';
        let history: any[] = [{
          stage: 'Leads',
          date: formData.dateInput,
          by: user.name,
          timestamp: Date.now(),
          note: 'Initial Input'
        }];

        if (formData.dateChated) {
          finalStatus = 'Chated';
          history.push({ stage: 'Chated', date: formData.dateChated, by: user.name, timestamp: Date.now() + 10 });
        }
        if (formData.dateResponsed) {
          finalStatus = 'Responsed';
          history.push({ stage: 'Responsed', date: formData.dateResponsed, by: user.name, timestamp: Date.now() + 20 });
        }
        if (formData.dateSetMeeting) {
          finalStatus = 'Set Meeting';
          history.push({ stage: 'Set Meeting', date: formData.dateSetMeeting, by: user.name, timestamp: Date.now() + 30 });
        }
        if (formData.dateClosed) {
          finalStatus = 'Close Win';
          history.push({ stage: 'Close Win', date: formData.dateClosed, by: user.name, timestamp: Date.now() + 40, dealValue: Number(formData.dealValue || 0), campaignNumber: Number(formData.campaignNumber || 1) });
        }

        const { data: newLead, error: insertErr } = await supabase.from('leads').insert(mapLeadToSupabase({
          ...payloadToSave,
          productOffered,
          owner: user.name,
          ownerId: user.uid || '',
          isDeleted: false,
          status: finalStatus as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })).select().single();
        if (insertErr) throw insertErr;
        const docRef = { id: newLead.id };

        const { error: noteErr } = await supabase.from('lead_notes').insert({
          lead_id: newLead.id,
          text: `Lead dibuat oleh ${user.name}`,
          author_name: 'System',
          is_log: true,
          note_type: 'note',
          created_at: new Date().toISOString()
        });
        if (noteErr) throw noteErr;

        const fHistory = history.map(h => ({
          lead_id: newLead.id,
          stage: h.stage,
          date_occurred: h.date,
          by_user_name: h.by,
          note: h.note || '',
          assigned_by: user.name,
          deal_value: h.dealValue || 0,
          campaign_number: h.campaignNumber || 1,
          created_at: new Date(h.timestamp).toISOString()
        }));
        
        const { error: histErr } = await supabase.from('funnel_history').insert(fHistory);
        if (histErr) throw histErr;

        // Register new category to global list if needed
        if (formData.category === 'Tambah Baru' && formData.customCategory.trim()) {
          await addCategory(formData.customCategory.trim());
        }

        // --- Sync with OI Forecast ---
        try {
          const { data: forecastSnap } = await supabase.from('oi_forecasts').select('*').eq('is_deleted', false);
            if (forecastSnap && forecastSnap.length > 0) {
            const forecastStatus = finalStatus === 'Close Win' ? 'WIN' : (finalStatus === 'Close Lost' || finalStatus === 'Failed' ? 'LOSE' : 'OPEN');
            const targetBrand = (formData.brandName || "").trim().toLowerCase();
            
            for (const fData of forecastSnap) {
              
              const fBrand = (fData.brand_name || "").trim().toLowerCase();
              
              // Match Brand
              if (fBrand !== targetBrand) continue;

              const fCategory = fData.category || '';
              
              // Match by product
              const isProductMatch = (productOffered || []).some(p => 
                fCategory.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(fCategory.toLowerCase().replace(' campaign', '').trim())
              );

              if (isProductMatch) {
                const fCampaign = Number(fData.campaign_number || 1);
                const lCampaign = Number(formData.campaignNumber || 1);

                if (fCampaign === lCampaign || (forecastStatus === 'OPEN')) {
                  await supabase.from('oi_forecasts').update({ status: forecastStatus, updated_at: new Date().toISOString() }).eq('id', fData.id);
                }
              }
            }
          }
        } catch (fErr) {
          console.error("Forecast sync failed:", fErr);
        }
        
        // History is already saved in funnel_history table
        
        toast.success("Lead baru ditambahkan");
      }
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateConfirm = async (existingLead: any) => {
    setDuplicateConfirm(null);
    setLoading(true);
    try {
      
      const changes = [`WA: ${existingLead.contact} -> ${formData.contact}`];
      await supabase.from('lead_notes').insert({
        lead_id: existingLead.id,
        text: `[SYSTEM] Data kontak diperbarui oleh ${user.name} saat mencoba tambah lead baru. ${changes.join(', ')}`,
        author_name: 'System',
        is_log: true,
        note_type: 'note'
      });
      await supabase.from('leads').update({ contact: formData.contact }).eq('id', existingLead.id);
      toast.success("Nomor kontak pada lead lama berhasil diupdate!");
      onClose();
    } catch (error: any) {
      toast.error("Gagal update data ganda: " + error.message);
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-lg text-gray-800 tracking-tight">
                {internalLead ? 'Edit Lead' : 'Tambah Lead Baru'}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-red-500 transition bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="form-lead" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tgl Input Data *</label>
                    <input 
                      type="date" 
                      name="dateInput"
                      value={formData.dateInput}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${errors.dateInput ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                      required 
                    />
                    {errors.dateInput && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.dateInput}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori Brand *</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                      required
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Tambah Baru" className="font-bold text-indigo-600">+ Tambah Baru</option>
                    </select>
                    {formData.category === 'Tambah Baru' && (
                      <input 
                        type="text" 
                        name="customCategory"
                        value={formData.customCategory}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${errors.customCategory ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                        placeholder="Ketik kategori baru..."
                        required 
                      />
                    )}
                    {errors.category && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.category}</p>}
                    {errors.customCategory && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.customCategory}</p>}
                  </div>
                </div>
                
                <div className="mb-5 p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl">
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Brand *</label>
                    <input 
                      type="text" 
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800 ${errors.brandName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                      required 
                    />
                    {errors.brandName && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.brandName}</p>}
                    
                    {smartMatch && !internalLead && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-black text-blue-900 leading-snug">Brand ini sudah ada di database!</p>
                            <p className="text-[10px] font-bold text-blue-700 mt-0.5">
                              {(() => {
                                const lastHistory = smartMatch.funnelHistory?.[smartMatch.funnelHistory.length - 1];
                                if (lastHistory) {
                                  return `Terakhir dikelola oleh ${lastHistory.by} (Status: ${lastHistory.stage} pada ${lastHistory.date})`;
                                }
                                return 'Telah diinput sebelumnya.';
                              })()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleLoadSmartMatch}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded uppercase tracking-widest transition-colors shadow-sm"
                        >
                          Muat Data & Beralih ke Mode Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Sumber Lead / Online Shop</label>
                    <select 
                      name="leadSource"
                      value={formData.leadSource}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="">-- Pilih Sumber (Opsional) --</option>
                      {LEAD_SOURCES.filter(s => s !== 'Lainnya').map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                      <option value="Tambah Baru" className="font-bold text-indigo-600">+ Tambah Baru</option>
                    </select>
                    {formData.leadSource === 'Tambah Baru' && (
                      <input 
                        type="text" 
                        name="customSource"
                        value={formData.customSource}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 mt-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${errors.customSource ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                        placeholder="Ketik sumber baru..."
                        required 
                      />
                    )}
                    {errors.customSource && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.customSource}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">No. WA / Kontak *</label>
                    <input 
                      type="text" 
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${errors.contact ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                      required 
                      placeholder="Contoh: 08123456789" 
                    />
                    {errors.contact && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.contact}</p>}
                  </div>
                  {internalLead && user.role === 'staff' && (
                    <p className="text-[10px] text-yellow-600 mt-2 font-semibold flex items-center gap-1">
                      <Info className="w-3 h-3" /> Perubahan pada Brand/WA akan dikirim sebagai Permohonan ke Admin.
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="mb-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email (Opsional)</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium" 
                    placeholder="Contoh: brand@email.com" 
                  />
                </div>

                {!internalLead ? (
                  <div className="mb-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <h4 className="text-[11px] font-black text-indigo-800 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-2">Jejak Funnel (Opsional)</h4>
                    <p className="text-[9px] font-bold text-slate-500 mb-4 leading-relaxed">
                      Jika Anda langsung menginput data yang sudah di follow-up sebelumnya, silakan isi tanggal-tanggal di bawah secara berurutan.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tgl Chated</label>
                        <input 
                          type="date" 
                          name="dateChated"
                          value={formData.dateChated}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tgl Responsed</label>
                        <input 
                          type="date" 
                          name="dateResponsed"
                          value={formData.dateResponsed}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tgl Set Meeting</label>
                        <input 
                          type="date" 
                          name="dateSetMeeting"
                          value={formData.dateSetMeeting}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tgl Close Win</label>
                        <input 
                          type="date" 
                          name="dateClosed"
                          value={formData.dateClosed}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium" 
                        />
                      </div>
                    </div>
                    
                    {formData.dateClosed && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex flex-col gap-3">
                        {(() => {
                          const previousWins = ((internalLead as any)?.funnelHistory as any[] || [])?.filter((h: any) => h.stage === 'Close Win') || [];
                          if (previousWins.length === 0) return null;
                          return (
                            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
                              <p className="text-[10px] font-black text-indigo-800 uppercase tracking-wider mb-2 border-b border-indigo-200 pb-1">
                                Histori Close Win Sebelumnya
                              </p>
                              <ul className="space-y-1.5">
                                {previousWins.map((w: any, i: number) => (
                                  <li key={i} className="text-[11px] font-bold text-indigo-700 flex justify-between items-center">
                                    <span>Campaign Ke-{w.campaignNumber || 1}</span>
                                    <span className="bg-white px-2 py-0.5 rounded border border-indigo-100">{w.date}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                        <div>
                          <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">Nominal Closing (Rp) *</label>
                          <CurrencyInput
                            value={formData.dealValue}
                            onChange={(val) => setFormData(prev => ({ ...prev, dealValue: val }))}
                            className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800 outline-none"
                          />
                          <p className="text-[9px] text-emerald-600 mt-1 font-bold italic">Nominal ini akan ditambahkan ke total pencapaian (Achievement) Target Anda bulan ini.</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">Campaign Keberapa? *</label>
                          <input
                            type="number"
                            name="campaignNumber"
                            value={formData.campaignNumber}
                            onChange={handleInputChange}
                            min="1"
                            className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Informasi Mode Edit
                    </h4>
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                      Untuk menambah atau memperbarui Status dan Jejak Funnel (seperti mencatat Close Win baru), silakan simpan data utama ini terlebih dahulu, lalu gunakan tombol <span className="font-black bg-amber-200 px-1 rounded shadow-sm">Update Status</span> di Halaman Detail Lead.
                    </p>
                  </div>
                )}

                {/* Product Offered Multi-Select */}
                <div className="mb-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Produk Ditawarkan</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProductOffered(prev => prev.includes('TNT') ? prev.filter(p => p !== 'TNT') : [...prev, 'TNT'])}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all active:scale-95",
                        productOffered.includes('TNT')
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                      )}
                    >
                      TNT
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductOffered(prev => prev.includes('Basemen') ? prev.filter(p => p !== 'Basemen') : [...prev, 'Basemen'])}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all active:scale-95",
                        productOffered.includes('Basemen')
                          ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                      )}
                    >
                      Basemen
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductOffered(prev => prev.includes('HYPE') ? prev.filter(p => p !== 'HYPE') : [...prev, 'HYPE'])}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl font-bold text-sm border-2 transition-all active:scale-95",
                        productOffered.includes('HYPE')
                          ? "bg-amber-400 text-white border-amber-400 shadow-lg shadow-amber-200"
                          : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                      )}
                    >
                      HYPE
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Action Plan Utama</label>
                  <textarea 
                    name="actionPlan"
                    value={formData.actionPlan}
                    onChange={handleInputChange}
                    rows={2} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                    placeholder="Contoh: Akan hubungi kembali minggu depan..."
                  ></textarea>
                </div>

                {internalLead && internalLead.status === 'Close Win' && (user.role === 'admin' || user.role === 'lord') && (
                  <div className="mt-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Deal Value (Rp)</label>
                      <CurrencyInput
                        value={formData.dealValue || 0}
                        onChange={(val) => setFormData(prev => ({ ...prev, dealValue: val }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button 
                type="submit" 
                form="form-lead"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : (internalLead ? 'Update Data' : 'Simpan Data')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!duplicateConfirm}
        onClose={() => setDuplicateConfirm(null)}
        onConfirm={() => handleDuplicateConfirm(duplicateConfirm!.existingLead)}
        title="Peringatan Duplikasi Data"
        message={`Brand ini sudah ada di sistem dengan nomor WA: ${duplicateConfirm?.existingLead.contact}. Apakah Anda ingin menimpa nomor WA tersebut menjadi ${formData.contact} dan mencatatnya ke histori?`}
      />
    </AnimatePresence>
  );
}
