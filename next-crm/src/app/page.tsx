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

  let finalUser = currentUser;
  if (!currentUser) {
    // Retry fetch or auto-register if concurrent
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
    // Let layout.tsx handle the pending screen
    return null;
  }
  finalUser.uid = finalUser.id;

  const { data: rawUsers } = await supabase.from('users').select('*');
  const users = (rawUsers || []).map((u: any) => ({
    uid: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));
  const { data: globalTargets } = await supabase.from('global_targets').select('*');
  const { data: individualTargets } = await supabase.from('individual_targets').select('*');

  // DashboardClient manages its own paginated data via get_dashboard_stats and .range() query
  // Passing empty array avoids fetching 6000+ leads and notes into memory unnecessarily
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardClient 
        leads={[]}
        user={finalUser as any}
        users={(users || []) as any}
        targets={globalTargets as any}
        individualTargets={individualTargets as any}
      />
    </div>
  );
}
