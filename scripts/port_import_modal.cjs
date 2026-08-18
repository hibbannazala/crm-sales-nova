const fs = require('fs');
const path = require('path');

const srcLegacy = path.join(__dirname, '../src/components/ImportModal.tsx');
const destClient = path.join(__dirname, '../next-crm/src/components/ImportModalClient.tsx');

let content = fs.readFileSync(srcLegacy, 'utf8');

// 1. Setup imports
content = `"use client";\n` + content;
content = content.replace(/import \{ db \} from '\.\.\/firebase';\n/, "import { createClient } from '@/utils/supabase/client';\nimport { useRouter } from 'next/navigation';\n");
content = content.replace(/import \{ collection, writeBatch, doc, getDocs \} from 'firebase\/firestore';\n/, "");

// 2. Component signature
content = content.replace(/export default function ImportModal\(\{ isOpen, onClose, users = \[\] \}: ImportModalProps\) \{/, `export default function ImportModalClient({ isOpen, onClose, users = [] }: ImportModalProps) {\n  const supabase = createClient();\n  const router = useRouter();\n  const mapLeadFromSupabase = (l: any) => ({\n    picName: l.pic_name,\n    brandName: l.brand_name,\n    contact: l.contact,\n    dateInput: l.date_input,\n    source: l.source,\n    category: l.category,\n    productOffered: l.product_offered || [],\n    notes: l.notes || '',\n    priority: l.priority || 'Low',\n    interestLevel: l.interest_level || 'Low',\n    status: l.status,\n    dealValue: l.deal_value || 0,\n    isDeleted: l.is_deleted || false,\n    funnelHistory: l.funnel_history || []\n  });\n\n  const mapLeadToSupabase = (ld: any) => ({\n    id: ld.id || crypto.randomUUID(),\n    pic_name: ld.picName,\n    brand_name: ld.brandName,\n    contact: ld.contact,\n    date_input: ld.dateInput,\n    source: ld.source,\n    category: ld.category,\n    product_offered: ld.productOffered || [],\n    notes: ld.notes || '',\n    priority: ld.priority || 'Low',\n    interest_level: ld.interestLevel || 'Low',\n    status: ld.status,\n    deal_value: ld.dealValue || 0,\n    is_deleted: ld.isDeleted || false,\n    funnel_history: ld.funnelHistory || [],\n    updated_at: new Date().toISOString()\n  });`);

// 3. Replace getDocs(collection(db, "leads"))
content = content.replace(/const existingSnapshot = await getDocs\(collection\(db, "leads"\)\);/g, `const { data: leadsData } = await supabase.from('leads').select('*');\n      const existingSnapshot = { docs: (leadsData||[]).map((l: any) => ({ id: l.id, data: () => mapLeadFromSupabase(l) })) };`);
content = content.replace(/const snapshot = await getDocs\(collection\(db, "leads"\)\);/g, `const { data: leadsData } = await supabase.from('leads').select('*');\n          const snapshot = { docs: (leadsData||[]).map((l: any) => ({ id: l.id, data: () => mapLeadFromSupabase(l) })) };`);

// 4. Replace batch insert in executeImport
content = content.replace(/for \(let i = 0; i < batchData\.length; i \+= chunkSize\) \{[\s\S]*?const batch = writeBatch\(db\);[\s\S]*?const slice = batchData\.slice\(i, i \+ chunkSize\);[\s\S]*?for \(const ld of slice\) \{[\s\S]*?const ref = ld\.id \? doc\(db, "leads", ld\.id\) : doc\(collection\(db, "leads"\)\);[\s\S]*?const payload = \{ \.\.\.ld, updatedAt: new Date\(\)\.toISOString\(\) \};[\s\S]*?batch\.set\(ref, payload, \{ merge: true \}\);[\s\S]*?\}[\s\S]*?await batch\.commit\(\);[\s\S]*?\}/, `for (let i = 0; i < batchData.length; i += chunkSize) {
        const slice = batchData.slice(i, i + chunkSize);
        const payloads = slice.map(ld => mapLeadToSupabase(ld));
        await supabase.from('leads').upsert(payloads);
      }`);

// 5. Replace batch update in processUpdateDates
content = content.replace(/for \(let i = 0; i < batchData\.length; i \+= chunkSize\) \{[\s\S]*?const batch = writeBatch\(db\);[\s\S]*?const slice = batchData\.slice\(i, i \+ chunkSize\);[\s\S]*?for \(const ld of slice\) \{[\s\S]*?const ref = doc\(db, "leads", ld\.id\);[\s\S]*?batch\.set\(ref, \{ funnelHistory: ld\.funnelHistory, status: ld\.status, updatedAt: new Date\(\)\.toISOString\(\) \}, \{ merge: true \}\);[\s\S]*?\}[\s\S]*?await batch\.commit\(\);[\s\S]*?\}/, `for (let i = 0; i < batchData.length; i += chunkSize) {
            const slice = batchData.slice(i, i + chunkSize);
            for (const ld of slice) {
              await supabase.from('leads').update({ funnel_history: ld.funnelHistory, status: ld.status, updated_at: new Date().toISOString() }).eq('id', ld.id);
            }
          }`);

// 6. Router refresh after finish
content = content.replace(/setImportResult\(\{new: newCount, updated: updatedCount, duplicates: duplicatesList\}\);\n      setStep\('result'\);/, `setImportResult({new: newCount, updated: updatedCount, duplicates: duplicatesList});\n      setStep('result');\n      router.refresh();`);

fs.writeFileSync(destClient, content);
console.log("Import Modal ported.");
