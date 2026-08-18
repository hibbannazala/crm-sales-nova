import React from 'react';
import AdminApprovalsClient from '@/components/AdminApprovalsClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'lord')) {
    redirect('/dashboard');
  }

  const { data: requests } = await supabase.from('edit_requests').select('*').order('timestamp', { ascending: false });

  const mapRequest = (r: any) => ({
    id: r.id,
    leadId: r.lead_id,
    requestedBy: r.requested_by,
    oldBrand: r.old_brand,
    newBrand: r.new_brand,
    oldContact: r.old_contact,
    newContact: r.new_contact,
    status: r.status,
    timestamp: r.timestamp
  });

  return <AdminApprovalsClient approvals={(requests || []).map(mapRequest)} />;
}
