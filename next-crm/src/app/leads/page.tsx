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

  let finalUser = currentUser;
  if (!currentUser) {
    const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User Baru';
    const { data: newUser } = await supabase.from('users').upsert({
      id: authData.user.id,
      auth_id: authData.user.id,
      email: authData.user.email,
      name: name,
      role: 'pending',
    }).select().single();
    finalUser = newUser;
  }

  if (!finalUser) {
    return <div>Akses Ditolak: Gagal melakukan pendaftaran otomatis. Hubungi Admin.</div>;
  }
  
  if (finalUser.role === 'pending') {
    return null;
  }
  finalUser.uid = finalUser.id;

  // Fetch all leads for the client side. 
  // In production with 6000 leads, this might be around 2-3MB. 
  // We limit to 10000 to ensure we get all data for the client component.
  let allLeads: any[] = [];
  let hasMore = true;
  let page = 0;
  while (hasMore) {
    const { data } = await supabase.from('leads').select('*, funnelHistory:funnel_history(*)').range(page * 1000, (page + 1) * 1000 - 1);
    if (data && data.length > 0) {
      allLeads = [...allLeads, ...data];
      page++;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  
  // Fetch all users for filters
  const { data: rawUsers } = await supabase.from('users').select('*');
  const users = (rawUsers || []).map((u: any) => ({
    uid: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));

  // Fetch targets
  const { data: globalTargets } = await supabase.from('global_targets').select('*');
  const { data: individualTargets } = await supabase.from('oi_targets').select('*');

  // We need to map Supabase columns (snake_case) back to Firebase properties (camelCase) 
  // if LeadsClient still uses camelCase.
  const mapLead = (l: any) => {
    // Derive PIC from funnel history if pic_name is not yet set
    const latestHistory = (l.funnelHistory || [])
      .filter((h: any) => h.by_user_name && h.by_user_name !== 'System' && h.by_user_name !== '-')
      .sort((a: any, b: any) => new Date(b.date_occurred).getTime() - new Date(a.date_occurred).getTime())[0];
    const derivedPic = l.pic_name || latestHistory?.by_user_name || '-';

    return {
      id: l.id,
      dateInput: l.date_input,
      picName: derivedPic,
      brandName: l.brand_name,
      contact: l.contact,
      source: l.source,
      category: l.category,
      productOffered: l.product_offered || [],
      notes: [], // Notes are fetched on-demand in lead detail page to avoid transferring megabytes of text
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
  };
};

  const mappedLeads = allLeads.map(mapLead);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <LeadsClient 
        leads={mappedLeads}
        user={finalUser as any}
        users={(users || []) as any}
        approvals={[]}
      />
    </div>
  );
}
