import React from 'react';
import TasksClient from '@/components/TasksClient';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: userData } = await supabase.from('users').select('*').eq('auth_id', session.user.id).single();
  if (!userData) redirect('/login');

  // Fetch tasks
  const { data: tasksData } = await supabase.from('tasks').select('*, users!tasks_assigned_to_fkey(name), leads(brand_name)').order('created_at', { ascending: false });
  const { data: allUsers } = await supabase.from('users').select('*');
  let allLeads: any[] = [];
  let hasMore = true;
  let page = 0;
  while (hasMore) {
    const { data } = await supabase.from('leads').select('id, brand_name').range(page * 1000, (page + 1) * 1000 - 1);
    if (data && data.length > 0) {
      allLeads = [...allLeads, ...data];
      page++;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  // Map tasks
  const mappedTasks = tasksData?.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    assignedToName: t.users?.name || 'Unknown',
    leadName: t.leads?.brand_name || ''
  })) || [];

  return <TasksClient initialTasks={mappedTasks} user={userData as any} users={allUsers as any} leads={allLeads as any} />;
}
