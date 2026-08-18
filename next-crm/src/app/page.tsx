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

  const { data: leads } = await supabase.from('leads').select('*').limit(10000);
  const { data: users } = await supabase.from('users').select('*');
  const { data: globalTargets } = await supabase.from('global_targets').select('*');
  const { data: individualTargets } = await supabase.from('oi_targets').select('*');

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
    funnelHistory: l.funnel_history || []
  });

  const mappedLeads = (leads || []).map(mapLead);

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
