import React from 'react';
import AdminUsersClient from '@/components/AdminUsersClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('role').eq('auth_id', session.user.id).single();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'lord')) {
    redirect('/dashboard');
  }

  const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });

  return <AdminUsersClient initialUsers={users || []} />;
}
