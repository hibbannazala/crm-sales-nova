const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../next-crm/src/components');

// 1. Fix StatusModalClient.tsx
const statusPath = path.join(srcDir, 'StatusModalClient.tsx');
let statusCode = fs.readFileSync(statusPath, 'utf8');

// The replacement logic:
const searchString = `      updateData.funnelHistory = updatedHistory;

      // Build notes array
      const notes = [...(lead.notes || [])];
      
      const assignLabel = wasAssigned ? \` (assigned by \${user.name})\` : '';
      if (isOverride) {
        notes.push({
          text: \`[SYSTEM] \${finalAuthor} memperbarui status \${status} pada tanggal \${date}\${assignLabel}\`,
          author: 'System',
          timestamp: new Date().toISOString(),
          isLog: true
        });
      } else if (lead.status !== status) {
        notes.push({
          text: \`[SYSTEM] Status diubah ke \${status} oleh \${finalAuthor}\${assignLabel}\`,
          author: 'System',
          timestamp: new Date().toISOString(),
          isLog: true
        });
      }

      // Add user note if provided
      if (noteText.trim() && !isOverride) {
        notes.push({
          text: noteText.trim(),
          author: user.name,
          timestamp: new Date().toISOString(),
          isLog: false
        });
      }

      updateData.notes = notes;

      await supabase.from('leads').update(updateData).eq('id', lead.id);`;

const replacementString = `      // Extract newly added entries from updatedHistory
      // Original logic appended to updatedHistory. We'll identify new ones since we don't save funnelHistory in leads table anymore.
      const existingHistoryLength = lead.funnelHistory?.length || 0;
      const newHistoryEntries = updatedHistory.slice(existingHistoryLength);
      
      const funnelInserts = newHistoryEntries.map(h => ({
        lead_id: lead.id,
        stage: h.stage,
        date_occurred: new Date(h.date || Date.now()).toISOString(),
        by_user_name: h.by || finalAuthor,
        created_at: new Date(h.timestamp || Date.now()).toISOString(),
        deal_value: h.dealValue || null,
        campaign_number: h.campaignNumber || null,
        note: h.note || null,
        assigned_by: h.assignedBy || null
      }));

      // Build new notes inserts
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

      // Convert camelCase updateData to snake_case for Supabase
      const supabaseUpdateData: any = { ...updateData };
      if (supabaseUpdateData.dateChated !== undefined) { supabaseUpdateData.date_chated = supabaseUpdateData.dateChated; delete supabaseUpdateData.dateChated; }
      if (supabaseUpdateData.dateResponsed !== undefined) { supabaseUpdateData.date_responsed = supabaseUpdateData.dateResponsed; delete supabaseUpdateData.dateResponsed; }
      if (supabaseUpdateData.dateSetMeeting !== undefined) { supabaseUpdateData.date_set_meeting = supabaseUpdateData.dateSetMeeting; delete supabaseUpdateData.dateSetMeeting; }
      if (supabaseUpdateData.dateClosed !== undefined) { supabaseUpdateData.date_closed = supabaseUpdateData.dateClosed; delete supabaseUpdateData.dateClosed; }
      if (supabaseUpdateData.dateFailed !== undefined) { supabaseUpdateData.date_failed = supabaseUpdateData.dateFailed; delete supabaseUpdateData.dateFailed; }
      if (supabaseUpdateData.dealValue !== undefined) { supabaseUpdateData.deal_value = supabaseUpdateData.dealValue; delete supabaseUpdateData.dealValue; }
      
      // Clean up array properties that don't belong in the table
      delete supabaseUpdateData.notes;
      delete supabaseUpdateData.funnelHistory;

      // Execute queries
      await supabase.from('leads').update(supabaseUpdateData).eq('id', lead.id);
      
      if (funnelInserts.length > 0) {
        await supabase.from('funnel_history').insert(funnelInserts);
      }
      if (notesInserts.length > 0) {
        await supabase.from('lead_notes').insert(notesInserts);
      }`;

statusCode = statusCode.replace(searchString, replacementString);
fs.writeFileSync(statusPath, statusCode);

// 2. Fix LeadModalClient.tsx
// I will just use `git restore` first in case my previous script ran on it, but the previous script did run and it modified it.
console.log("Done");
