const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../next-crm/src/components');
const leadPath = path.join(srcDir, 'LeadModalClient.tsx');
let leadCode = fs.readFileSync(leadPath, 'utf8');

// 1. In LeadModalClient, replace the duplicate update logic
const searchDuplicate = `      await supabase.from('leads').update({ contact: formData.contact, notes }).eq('id', existingLead.id);`;
const replaceDuplicate = `      await supabase.from('lead_notes').insert({
        lead_id: existingLead.id,
        text: \`[SYSTEM] Data kontak diperbarui oleh \${user.name} saat mencoba tambah lead baru. \${changes.join(', ')}\`,
        author_name: 'System',
        is_log: true,
        note_type: 'note'
      });
      await supabase.from('leads').update({ contact: formData.contact }).eq('id', existingLead.id);`;
leadCode = leadCode.replace(searchDuplicate, replaceDuplicate);

// 2. In LeadModalClient, replace the notes.push logic for duplicate
const searchDuplicateNotesPush = `      const notes = [...(existingLead.notes || [])];
      notes.push({
        text: \`[SYSTEM] Data kontak diperbarui oleh \${user.name} saat mencoba tambah lead baru. \${changes.join(', ')}\`,
        author: 'System',
        timestamp: new Date().toISOString(),
        isLog: true
      });`;
leadCode = leadCode.replace(searchDuplicateNotesPush, `      // notes insertion replaced by table insert below`);

// 3. In LeadModalClient edit logic (around line 273)
const searchEditLogic = `          const notes = [...(internalLead.notes || [])];
          if (changes.length > 0) {
            notes.push({
              text: \`[SYSTEM] Data diperbarui oleh \${user.name}. \${changes.join(', ')}\`,
              author: 'System',
              timestamp: new Date().toISOString(),
              isLog: true
            });
          }

          await supabase.from('leads').update(mapLeadToSupabase({ ...payloadToSave, productOffered, notes, updatedAt: new Date().toISOString() })).eq('id', internalLead.id);`;

const replaceEditLogic = `          if (changes.length > 0) {
            await supabase.from('lead_notes').insert({
              lead_id: internalLead.id,
              text: \`[SYSTEM] Data diperbarui oleh \${user.name}. \${changes.join(', ')}\`,
              author_name: 'System',
              is_log: true,
              note_type: 'note'
            });
          }

          await supabase.from('leads').update(mapLeadToSupabase({ ...payloadToSave, productOffered, updatedAt: new Date().toISOString() })).eq('id', internalLead.id);`;

leadCode = leadCode.replace(searchEditLogic, replaceEditLogic);

// 4. In LeadModalClient new logic (around line 370)
const searchNewLogic = `        const { data: newLead } = await supabase.from('leads').insert(mapLeadToSupabase({
          ...payloadToSave,
          productOffered,
          owner: user.name,
          ownerId: user.uid || '',
          isDeleted: false,
          notes: [{
            text: \`Lead dibuat oleh \${user.name}\`,
            author: 'System',
            timestamp: new Date().toISOString(),
            isLog: true
          }],
          funnelHistory: history,
          status: finalStatus as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })).select().single();
        const docRef = { id: newLead.id };

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
        
        // History is already saved in funnelHistory array via Supabase JSONB column.
        await supabase.from('leads').update({ funnel_history: history }).eq('id', docRef.id);`;

const replaceNewLogic = `        const { data: newLead } = await supabase.from('leads').insert(mapLeadToSupabase({
          ...payloadToSave,
          productOffered,
          owner: user.name,
          ownerId: user.uid || '',
          isDeleted: false,
          status: finalStatus as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })).select().single();
        const docRef = { id: newLead.id };

        // Insert initial history
        if (history && history.length > 0) {
          const funnelInserts = history.map(h => ({
            lead_id: docRef.id,
            stage: h.stage,
            date_occurred: new Date(h.date || Date.now()).toISOString(),
            by_user_name: h.by,
            created_at: new Date(h.timestamp || Date.now()).toISOString(),
            note: h.note || null,
            deal_value: h.dealValue || null,
            campaign_number: h.campaignNumber || null
          }));
          await supabase.from('funnel_history').insert(funnelInserts);
        }

        // Insert initial note
        await supabase.from('lead_notes').insert({
          lead_id: docRef.id,
          text: \`Lead dibuat oleh \${user.name}\`,
          author_name: 'System',
          is_log: true,
          note_type: 'note'
        });

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
        }`;

leadCode = leadCode.replace(searchNewLogic, replaceNewLogic);
fs.writeFileSync(leadPath, leadCode);

// 5. NotesModalClient.tsx
const notesPath = path.join(srcDir, 'NotesModalClient.tsx');
let notesCode = fs.readFileSync(notesPath, 'utf8');

const searchNotesSave = `  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("Catatan tidak boleh kosong");
      return;
    }
    setLoading(true);
    try {
      const notes = [...(lead.notes || [])];
      notes.push({
        text: text.trim(),
        author: user.name,
        timestamp: new Date().toISOString(),
        isLog: false
      });
      await supabase.from('leads').update({ notes }).eq('id', lead.id);
      
      toast.success("Catatan berhasil ditambahkan");
      setText('');
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyimpan catatan: " + error.message);
    } finally {
      setLoading(false);
    }
  };`;

const replaceNotesSave = `  const handleSave = async () => {
    if (!text.trim()) {
      toast.error("Catatan tidak boleh kosong");
      return;
    }
    setLoading(true);
    try {
      await supabase.from('lead_notes').insert({
        lead_id: lead.id,
        text: text.trim(),
        author_name: user.name,
        is_log: false,
        note_type: 'note'
      });
      toast.success("Catatan berhasil ditambahkan");
      setText('');
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyimpan catatan: " + error.message);
    } finally {
      setLoading(false);
    }
  };`;

notesCode = notesCode.replace(searchNotesSave, replaceNotesSave);
fs.writeFileSync(notesPath, notesCode);

console.log("Done");
