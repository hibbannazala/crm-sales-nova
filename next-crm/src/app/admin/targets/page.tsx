import React from 'react';
import AdminTargetsClient from '@/components/AdminTargetsClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function TargetsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'lord')) {
    redirect('/dashboard');
  }

  const { data: globalTargetsData } = await supabase.from('global_targets').select('*');
  const { data: individualTargetsData } = await supabase.from('oi_targets').select('*');
  const { data: users } = await supabase.from('users').select('*').neq('role', 'pending').neq('role', 'lord');

  const mapTarget = (t: any) => ({
    id: t.id,
    monthYear: t.month_year,
    targetChat: t.target_chat,
    targetMeeting: t.target_meeting,
    targetRevenue: t.target_revenue,
    updatedAt: t.updated_at,
    updatedBy: t.updated_by,
    userId: t.user_id,
    userName: t.user_name
  });

  return (
    <AdminTargetsClient 
      targets={(globalTargetsData || []).map(mapTarget)}
      individualTargets={(individualTargetsData || []).map(mapTarget)}
      users={users || []}
      user={currentUser as any}
      auditLogs={[]}
    />
  );
}
