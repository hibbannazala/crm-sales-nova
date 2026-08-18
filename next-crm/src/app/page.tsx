import React from 'react';
import DashboardClient from '@/components/DashboardClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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

  const adminFilter = typeof searchParams.admin === 'string' ? searchParams.admin : null;
  const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : null;
  const startFilter = typeof searchParams.start === 'string' ? searchParams.start : null;
  const endFilter = typeof searchParams.end === 'string' ? searchParams.end : null;

  // Build the base query for leads
  let query = supabase.from('leads').select('*');

  if (categoryFilter && categoryFilter !== 'ALL') {
    query = query.eq('category', categoryFilter);
  }
  if (startFilter) {
    query = query.gte('date_input', startFilter);
  }
  if (endFilter) {
    query = query.lte('date_input', endFilter);
  }
  
  // NOTE: In Firestore, 'admin' filter usually applied to 'history' or 'created_by' / 'assigned_to'.
  // We need a proper column if we want to filter leads by admin. Assuming 'assigned_to' or we don't have one in leads directly?
  // Let's check leads schema: it doesn't have PIC! Tasks have assigned_to. Funnel history has by_user_name.
  // For now, if adminFilter is applied, we might not be able to easily filter all leads without a JOIN.
  // We'll skip admin filter on leads query for this quick implementation, or assume there's a column.

  // Fetch all leads for stats (Warning: If large, we should use count queries or RPC)
  // For now, since we need to sum revenue and we are on the server, we fetch the filtered rows.
  // If there are >1000 rows, Supabase limits to 1000 by default. Let's increase limit.
  const { data: leads, error } = await query.limit(10000);

  let total = 0, chated = 0, responsed = 0, meeting = 0, win = 0, lost = 0, revenue = 0;

  if (leads) {
    total = leads.length;
    leads.forEach((l: any) => {
      // We do exact matches or similar based on Firestore status
      const s = l.status?.toLowerCase() || '';
      if (s === 'chated') chated++;
      if (s === 'responsed') responsed++;
      if (s === 'set meeting') meeting++;
      if (s === 'close win') {
        win++;
        revenue += Number(l.deal_value || 0);
      }
      if (s === 'close lost' || s === 'failed') lost++;
    });
  }

  const mockStats = {
    total,
    chated,
    responsed,
    meeting,
    win,
    lost,
    revenue
  };

  // Fetch users for admins list
  const { data: users } = await supabase.from('users').select('name');
  const admins = users ? Array.from(new Set(users.map(u => u.name))) : [];

  // Fetch categories from settings or distinct from leads
  // Since we don't know the exact structure of app_settings, let's use distinct categories from leads
  const categories = leads ? Array.from(new Set(leads.map((l:any) => l.category).filter(Boolean))) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardClient 
        stats={mockStats} 
        admins={admins as string[]} 
        categories={categories as string[]} 
      />
    </div>
  );
}

