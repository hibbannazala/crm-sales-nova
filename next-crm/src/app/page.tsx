import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import DashboardClient from '@/components/DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
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

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authData.user.id)
    .single();

  if (!currentUser) {
    return <div>Akses Ditolak: Email Anda tidak terdaftar sebagai staf.</div>;
  }

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
  const { data: users } = await supabase.from('users').select('*');
  const { data: globalTargets } = await supabase.from('global_targets').select('*');
  const { data: individualTargets } = await supabase.from('individual_targets').select('*');

  const mapLead = (l: any) => ({
    id: l.id,
    dateInput: l.date_input,
    picName: l.pic_name || l.owner,
    brandName: l.brand_name,
    contact: l.contact,
    source: l.source || l.lead_source,
    category: l.category,
    productOffered: l.product_offered || [],
    notes: (l.notes || []).map((n: any) => ({
      text: n.text,
      author: n.author_name,
      timestamp: n.created_at,
      type: n.note_type,
      isLog: n.is_log
    })),
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
      <DashboardClient 
        leads={mappedLeads}
        user={currentUser as any}
        users={(users || []) as any}
        targets={globalTargets as any}
        individualTargets={individualTargets as any}
      />
    </div>
  );
}
