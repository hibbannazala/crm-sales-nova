import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LeadDetailClient from '@/components/LeadDetailClient';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Get current user profile
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', authUser.email)
    .single();

  if (!currentUser) {
    redirect('/login');
  }

  // Get all users for assignment drops
  const { data: rawUsers } = await supabase.from('users').select('*');
  const users = (rawUsers || []).map((u: any) => ({
    uid: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));

  // Get Lead
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (!lead) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-black text-slate-800 mb-4">404</h1>
          <p className="text-slate-500 mb-8">Lead tidak ditemukan atau sudah dihapus.</p>
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-left font-mono text-sm mb-8 overflow-auto">
            <p><strong>Debug Info:</strong></p>
            <p>ID: {resolvedParams.id}</p>
            <p>Error: {JSON.stringify(error)}</p>
            <p>User Email: {authUser.email}</p>
          </div>
          <a href="/leads" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">Kembali ke Leads</a>
        </div>
      </div>
    );
  }

  // Map snake_case to camelCase for the client
  const mappedLead = {
    ...lead,
    brandName: lead.brand_name,
    picName: lead.pic_name,
    interestLevel: lead.interest_level,
    productOffered: lead.product_offered,
    leadSource: lead.lead_source,
    dateInput: lead.date_input,
    dateChated: lead.date_chated,
    dateResponsed: lead.date_responsed,
    dateSetMeeting: lead.date_set_meeting,
    dateClosed: lead.date_closed,
    dealValue: lead.deal_value,
    actionPlan: lead.action_plan,
  };

  return (
    <LeadDetailClient 
      lead={mappedLead} 
      user={currentUser} 
      users={users || []} 
    />
  );
}
