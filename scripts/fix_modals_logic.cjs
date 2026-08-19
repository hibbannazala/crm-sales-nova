const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../next-crm/src/components');

// 1. Fix StatusModalClient.tsx
const statusPath = path.join(srcDir, 'StatusModalClient.tsx');
let statusCode = fs.readFileSync(statusPath, 'utf8');

statusCode = statusCode.replace(
  /updatedHistory\.push\(\.\.\.retroactiveEntries\);\s*const funnelEntry: any = \{\s*stage: status,\s*date: status === 'Leads' \? lead\.dateInput : date,\s*by: finalAuthor,\s*timestamp: Date\.now\(\)\s*\};\s*if \(status === 'Close Win'\) \{\s*funnelEntry\.dealValue = Number\(dealValue \|\| 0\);\s*funnelEntry\.campaignNumber = Number\(campaignNumber \|\| 1\);\s*\}\s*if \(noteText\.trim\(\)\) \{\s*funnelEntry\.note = noteText\.trim\(\);\s*\}\s*if \(wasAssigned\) \{\s*funnelEntry\.assignedBy = user\.name;\s*\}\s*updatedHistory\.push\(funnelEntry\);\s*\}\s*updateData\.funnelHistory = updatedHistory;\s*\/\/ Build notes array\s*const notes = \[\.\.\.\(lead\.notes \|\| \[\]\)\];\s*const assignLabel = wasAssigned \? ` \(assigned by \$\{user\.name\}\)` : '';\s*if \(isOverride\) \{\s*notes\.push\(\{[\s\S]*?\}\);\s*\} else if \(lead\.status !== status\) \{\s*notes\.push\(\{[\s\S]*?\}\);\s*\}\s*\/\/ Add user note if provided\s*if \(noteText\.trim\(\) && !isOverride\) \{\s*notes\.push\(\{[\s\S]*?\}\);\s*\}\s*updateData\.notes = notes;\s*await supabase\.from\('leads'\)\.update\(updateData\)\.eq\('id', lead\.id\);/,
  `
      // PREPARE FUNNEL HISTORY INSERTS
      const funnelInserts = retroactiveEntries.map(r => ({
        lead_id: lead.id,
        stage: r.stage,
        date_occurred: new Date(r.date).toISOString(),
        by_user_name: r.by,
        created_at: new Date(r.timestamp).toISOString()
      }));

      const funnelEntry: any = {
        lead_id: lead.id,
        stage: status,
        date_occurred: new Date(status === 'Leads' ? lead.dateInput : date).toISOString(),
        by_user_name: finalAuthor,
        created_at: new Date().toISOString()
      };

      if (status === 'Close Win') {
        funnelEntry.deal_value = Number(dealValue || 0);
        funnelEntry.campaign_number = Number(campaignNumber || 1);
      }
      if (noteText.trim()) funnelEntry.note = noteText.trim();
      if (wasAssigned) funnelEntry.assigned_by = user.name;
      
      funnelInserts.push(funnelEntry);

      // PREPARE NOTES INSERTS
      const notesInserts = [];
      const assignLabel = wasAssigned ? \` (assigned by \${user.name})\` : '';
      
      if (isOverride) {
        notesInserts.push({
          lead_id: lead.id,
          text: \`[SYSTEM] \${finalAuthor} memperbarui status \${status} pada tanggal \${date}\${assignLabel}\`,
          author_name: 'System',
          is_log: true,
          note_type: 'note'
        });
      } else if (lead.status !== status) {
        notesInserts.push({
          lead_id: lead.id,
          text: \`[SYSTEM] Status diubah ke \${status} oleh \${finalAuthor}\${assignLabel}\`,
          author_name: 'System',
          is_log: true,
          note_type: 'note'
        });
      }

      if (noteText.trim() && !isOverride) {
        notesInserts.push({
          lead_id: lead.id,
          text: noteText.trim(),
          author_name: user.name,
          is_log: false,
          note_type: 'note'
        });
      }

      // 1. UPDATE LEADS TABLE (DO NOT include notes or funnelHistory as they don't exist)
      delete updateData.notes;
      delete updateData.funnelHistory;
      await supabase.from('leads').update(updateData).eq('id', lead.id);

      // 2. INSERT INTO FUNNEL HISTORY TABLE
      if (funnelInserts.length > 0) {
        await supabase.from('funnel_history').insert(funnelInserts);
      }

      // 3. INSERT INTO LEAD NOTES TABLE
      if (notesInserts.length > 0) {
        await supabase.from('lead_notes').insert(notesInserts);
      }
      } else {
        // if no changes, still do nothing
        await supabase.from('leads').update(updateData).eq('id', lead.id);
      }
`
);

// We need to fix the outer if block closing correctly.
// Let's do a more robust replace for StatusModalClient.tsx by replacing the entire handleSave content.
statusCode = statusCode.replace(
  /const handleSave = async \(\) => \{[\s\S]*?\/\/ --- Global Audit Log ---/m,
  `const handleSave = async () => {
    if (loading) return;
    
    // Prevent unchecking "Set Meeting"
    if (lead.status === 'Set Meeting' && status === 'Responsed' && !isOverride) {
      toast.error("Lead yang sudah Set Meeting tidak bisa dikembalikan ke Responsed, kecuali lewat Edit Lead (Override).");
      return;
    }
    // Prevent moving back from Win/Lost unless Override
    if ((lead.status === 'Close Win' || lead.status === 'Close Lost' || lead.status === 'Failed') && !isOverride) {
      if (status !== lead.status) {
        toast.error("Lead yang sudah Close/Failed tidak bisa diubah statusnya, kecuali lewat Edit Lead (Override).");
        return;
      }
    }

    setLoading(true);
    try {
      const finalAuthor = user.name;
      const updateData: any = {
        status: status as any
      };

      if (status === 'Chated') updateData.date_chated = new Date(date).toISOString();
      if (status === 'Responsed') updateData.date_responsed = new Date(date).toISOString();
      if (status === 'Set Meeting') updateData.date_set_meeting = new Date(date).toISOString();
      if (status === 'Close Win' || status === 'Close Lost') {
        updateData.date_closed = new Date(date).toISOString();
      }
      if (status === 'Failed') {
        updateData.date_failed = new Date(date).toISOString();
      }

      if (status === 'Close Win') {
        updateData.deal_value = Number(dealValue || 0);
      }

      let funnelInserts = [];
      let notesInserts = [];
      
      const wasAssigned = !!selectedPic && selectedPic !== user.name;

      if (!isOverride && lead.status !== status) {
        let retroactiveEntries = [];
        let timeOffset = 3000; 

        if (showMissingChated) {
          updateData.date_chated = new Date(missingChatedDate).toISOString();
          retroactiveEntries.push({ stage: 'Chated', date: missingChatedDate, by: finalAuthor, timestamp: Date.now() - timeOffset });
          timeOffset -= 1000;
        }
        if (showMissingResponsed) {
          updateData.date_responsed = new Date(missingResponsedDate).toISOString();
          retroactiveEntries.push({ stage: 'Responsed', date: missingResponsedDate, by: finalAuthor, timestamp: Date.now() - timeOffset });
          timeOffset -= 1000;
        }
        if (showMissingSetMeeting) {
          updateData.date_set_meeting = new Date(missingSetMeetingDate).toISOString();
          retroactiveEntries.push({ stage: 'Set Meeting', date: missingSetMeetingDate, by: finalAuthor, timestamp: Date.now() - timeOffset });
        }
        
        funnelInserts = retroactiveEntries.map(r => ({
          lead_id: lead.id,
          stage: r.stage,
          date_occurred: new Date(r.date).toISOString(),
          by_user_name: r.by,
          created_at: new Date(r.timestamp).toISOString()
        }));

        const funnelEntry: any = {
          lead_id: lead.id,
          stage: status,
          date_occurred: new Date(status === 'Leads' ? lead.dateInput : date).toISOString(),
          by_user_name: finalAuthor,
          created_at: new Date().toISOString()
        };

        if (status === 'Close Win') {
          funnelEntry.deal_value = Number(dealValue || 0);
          funnelEntry.campaign_number = Number(campaignNumber || 1);
        }
        if (noteText.trim()) funnelEntry.note = noteText.trim();
        if (wasAssigned) funnelEntry.assigned_by = user.name;
        
        funnelInserts.push(funnelEntry);
      }

      const assignLabel = wasAssigned ? \` (assigned by \${user.name})\` : '';
      
      if (isOverride) {
        notesInserts.push({
          lead_id: lead.id,
          text: \`[SYSTEM] \${finalAuthor} memperbarui status \${status} pada tanggal \${date}\${assignLabel}\`,
          author_name: 'System',
          is_log: true,
          note_type: 'note'
        });
      } else if (lead.status !== status) {
        notesInserts.push({
          lead_id: lead.id,
          text: \`[SYSTEM] Status diubah ke \${status} oleh \${finalAuthor}\${assignLabel}\`,
          author_name: 'System',
          is_log: true,
          note_type: 'note'
        });
      }

      if (noteText.trim() && !isOverride) {
        notesInserts.push({
          lead_id: lead.id,
          text: noteText.trim(),
          author_name: user.name,
          is_log: false,
          note_type: 'note'
        });
      }

      // Update basic lead table
      await supabase.from('leads').update(updateData).eq('id', lead.id);

      // Insert relational data
      if (funnelInserts.length > 0) {
        await supabase.from('funnel_history').insert(funnelInserts);
      }
      if (notesInserts.length > 0) {
        await supabase.from('lead_notes').insert(notesInserts);
      }

      // --- Sync with OI Forecast ---`
);

fs.writeFileSync(statusPath, statusCode);

// 2. Fix LeadModalClient.tsx
const leadPath = path.join(srcDir, 'LeadModalClient.tsx');
let leadCode = fs.readFileSync(leadPath, 'utf8');

// Inside mapLeadToSupabase, delete notes and funnelHistory explicitly so they never go to supabase
leadCode = leadCode.replace(
  /if \(mapped\.funnelHistory !== undefined\) \{ mapped\.funnel_history = mapped\.funnelHistory; delete mapped\.funnelHistory; \}/,
  `delete mapped.funnelHistory; delete mapped.funnel_history; delete mapped.notes;`
);

// Fix Edit Lead logic inside LeadModalClient.tsx (lines ~273-284)
leadCode = leadCode.replace(
  /const notes = \[\.\.\.\(internalLead\.notes \|\| \[\]\)\];\s*if \(changes\.length > 0\) \{\s*notes\.push\(\{\s*text: `\[SYSTEM\] Data diperbarui oleh \$\{user\.name\}\. \$\{changes\.join\(', '\)\}`,\s*author: 'System',\s*timestamp: new Date\(\)\.toISOString\(\),\s*isLog: true\s*\}\);\s*\}\s*await supabase\.from\('leads'\)\.update\(mapLeadToSupabase\(\{ \.\.\.payloadToSave, productOffered, notes, updatedAt: new Date\(\)\.toISOString\(\) \}\)\)\.eq\('id', internalLead\.id\);/,
  `
          if (changes.length > 0) {
            await supabase.from('lead_notes').insert({
              lead_id: internalLead.id,
              text: \`[SYSTEM] Data diperbarui oleh \${user.name}. \${changes.join(', ')}\`,
              author_name: 'System',
              is_log: true,
              note_type: 'note'
            });
          }
          await supabase.from('leads').update(mapLeadToSupabase({ ...payloadToSave, productOffered, updatedAt: new Date().toISOString() })).eq('id', internalLead.id);
  `
);

// Fix New Lead logic inside LeadModalClient.tsx (lines ~370-432)
leadCode = leadCode.replace(
  /const \{ data: newLead \} = await supabase\.from\('leads'\)\.insert\(mapLeadToSupabase\(\{\s*\.\.\.payloadToSave,\s*productOffered,\s*owner: user\.name,\s*ownerId: user\.uid \|\| '',\s*isDeleted: false,\s*notes: \[\{\s*text: `Lead dibuat oleh \$\{user\.name\}`,\s*author: 'System',\s*timestamp: new Date\(\)\.toISOString\(\),\s*isLog: true\s*\}\],\s*funnelHistory: history,\s*status: finalStatus as any,\s*createdAt: new Date\(\)\.toISOString\(\),\s*updatedAt: new Date\(\)\.toISOString\(\)\s*\}\)\)\.select\(\)\.single\(\);\s*const docRef = \{ id: newLead\.id \};\s*\/\/ Register new category to global list if needed\s*if \(formData\.category === 'Tambah Baru' && formData\.customCategory\.trim\(\)\) \{\s*await addCategory\(formData\.customCategory\.trim\(\)\);\s*\}\s*\/\/ --- Sync with OI Forecast ---\s*try \{\s*const \{ data: forecastSnap \} = await supabase\.from\('oi_forecasts'\)\.select\('\*'\)\.eq\('is_deleted', false\);\s*if \(forecastSnap && forecastSnap\.length > 0\) \{[\s\S]*?\}\s*\} catch \(fErr\) \{\s*console\.error\("Forecast sync failed:", fErr\);\s*\}\s*\/\/ History is already saved in funnelHistory array via Supabase JSONB column\.\s*await supabase\.from\('leads'\)\.update\(\{ funnel_history: history \}\)\.eq\('id', docRef\.id\);\s*toast\.success\("Lead baru ditambahkan"\);/,
  `const { data: newLead } = await supabase.from('leads').insert(mapLeadToSupabase({
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
        }
        
        toast.success("Lead baru ditambahkan");`
);

// Fix Duplicate contact logic inside LeadModalClient.tsx (lines ~455)
leadCode = leadCode.replace(
  /await supabase\.from\('leads'\)\.update\(\{ contact: formData\.contact, notes \}\)\.eq\('id', existingLead\.id\);/,
  `
      await supabase.from('lead_notes').insert({
        lead_id: existingLead.id,
        text: \`[SYSTEM] Data kontak diperbarui oleh \${user.name} saat mencoba tambah lead baru. \${changes.join(', ')}\`,
        author_name: 'System',
        is_log: true,
        note_type: 'note'
      });
      await supabase.from('leads').update({ contact: formData.contact }).eq('id', existingLead.id);
  `
);

// Clean up duplicate notes array builder before duplicate contact
leadCode = leadCode.replace(
  /const notes = \[\.\.\.\(existingLead\.notes \|\| \[\]\)\];\s*notes\.push\(\{[\s\S]*?\}\);/,
  ``
);

fs.writeFileSync(leadPath, leadCode);

// 3. Fix NotesModalClient.tsx
const notesPath = path.join(srcDir, 'NotesModalClient.tsx');
let notesCode = fs.readFileSync(notesPath, 'utf8');

notesCode = notesCode.replace(
  /const handleSave = async \(\) => \{[\s\S]*?toast\.error\("Gagal menyimpan catatan: " \+ error\.message\);\s+\}\s+\};/,
  `const handleSave = async () => {
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
  };`
);

fs.writeFileSync(notesPath, notesCode);
console.log("Done");
