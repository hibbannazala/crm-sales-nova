'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Contoh Server Action untuk Bulk Delete
export async function bulkDeleteLeads(leadIds: string[]) {
  const supabase = await createClient()

  // Pastikan user adalah admin atau lord (Bisa dicek via RLS atau Auth di sini)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Soft delete (mengubah is_deleted menjadi true)
  const { error } = await supabase
    .from('leads')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .in('id', leadIds)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidasi cache halaman leads
  revalidatePath('/leads')
  return { success: true }
}

// Contoh Server Action untuk CSV Import Batch
export async function importLeadsBatch(leadsData: any[]) {
  const supabase = await createClient()

  // Operasi Insert/Upsert massal
  const { error } = await supabase
    .from('leads')
    .insert(leadsData) // asumsikan leadsData sudah di-map ke nama kolom SQL

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/leads')
  return { success: true }
}
