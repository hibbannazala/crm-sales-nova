import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import LeadsClient from '@/components/LeadsClient';
import { redirect } from 'next/navigation';

export default async function LeadsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    redirect('/login');
  }

  // Get current user profile from users table
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authData.user.id)
    .single();

  if (!currentUser) {
    // If not found in users table, maybe the trigger hasn't fired yet, or they are not registered
    return <div>Akses Ditolak: Email Anda tidak terdaftar sebagai staf.</div>;
  }

  // Fetch all leads for the client side. 
  // In production with 6000 leads, this might be around 2-3MB. 
  // We limit to 10000 to ensure we get all data for the client component.
  let allLeads: any[] = [];
  let hasMore = true;
  let page = 0;
  while (hasMore) {
    const { data } = await supabase.from('leads').select('*, funnelHistory:funnel_history(*), notes:lead_notes(*)').range(page * 1000, (page + 1) * 1000 - 1);
    if (data && data.length > 0) {
      allLeads = [...allLeads, ...data];
      page++;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  
  // Fetch all users for filters
  const { data: users } = await supabase.from('users').select('*');

  // Fetch targets
  const { data: globalTargets } = await supabase.from('global_targets').select('*');
  const { data: individualTargets } = await supabase.from('oi_targets').select('*');

  // We need to map Supabase columns (snake_case) back to Firebase properties (camelCase) 
  // if LeadsClient still uses camelCase.
  // We can do this safely inside LeadsClient or here. Let's do a simple mapping here.
  const mapLead = (l: any) => ({
    id: l.id,
    dateInput: l.date_input,
    picName: l.pic_name,
    brandName: l.brand_name,
    contact: l.contact,
    source: l.source,
    category: l.category,
    productOffered: l.product_offered || [],
    notes: l.notes || '',
    priority: l.priority || 'Low',
    interestLevel: l.interest_level || 'Low',
    status: l.status,
    dealValue: l.deal_value || 0,
    isDeleted: l.is_deleted || false,
    funnelHistory: (l.funnelHistory || []).map((h: any) => ({
      stage: h.stage,
      date: h.date_occurred,
      dealValue: h.deal_value,
      campaignNumber: h.campaign_number,
      note: h.note,
      assignedBy: h.assigned_by,
      by: h.by_user_name,
      timestamp: h.created_at ? new Date(h.created_at).getTime() : 0
    }))
  });

  const mappedLeads = allLeads.map(mapLead);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <LeadsClient 
        leads={mappedLeads}
        user={currentUser as any}
        users={(users || []) as any}
        approvals={[]}
      />
    </div>
  );
}
