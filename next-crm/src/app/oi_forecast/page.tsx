import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OIForecastClient from '@/components/OIForecastClient';
import { redirect } from 'next/navigation';

export default async function OIForecastPage() {
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

  const { data: currentUser } = await supabase.from('users').select('*').eq('auth_id', authData.user.id).single();
  if (currentUser) {
    currentUser.uid = currentUser.id;
  }

  let allLeads: any[] = [];
  let hasMore = true;
  let page = 0;
  while (hasMore) {
    const { data } = await supabase.from('leads').select('*').range(page * 1000, (page + 1) * 1000 - 1);
    if (data && data.length > 0) {
      allLeads = [...allLeads, ...data];
      page++;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  let allForecasts: any[] = [];
  let forecastPage = 0;
  let hasMoreForecasts = true;
  while (hasMoreForecasts) {
    const { data } = await supabase.from('oi_forecast').select('*').range(forecastPage * 1000, (forecastPage + 1) * 1000 - 1);
    if (data && data.length > 0) {
      allForecasts = [...allForecasts, ...data];
      forecastPage++;
      if (data.length < 1000) hasMoreForecasts = false;
    } else {
      hasMoreForecasts = false;
    }
  }

  const { data: rawUsers } = await supabase.from('users').select('*');
  const users = (rawUsers || []).map((u: any) => ({
    uid: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  }));
  const { data: forecasts } = await supabase.from('oi_forecasts').select('*');
  const { data: targets } = await supabase.from('oi_targets').select('*');

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

  const mapForecast = (f: any) => ({
    id: f.id,
    leadId: f.lead_id,
    monthYear: f.month_year,
    product: f.product,
    value: f.value,
    campaignNumber: f.campaign_number,
    budgetAds: f.budget_ads,
    budgetCreator: f.budget_creator,
    grossMargin: f.gross_margin,
    realMargin: f.real_margin,
    realPayment: f.real_payment,
    targetGMV: f.target_gmv,
    targetCreator: f.target_creator,
    targetVideoAffiliate: f.target_video_affiliate,
    targetVideoInternal: f.target_video_internal,
    targetViews: f.target_views,
    successRate: f.success_rate,
    status: f.status,
    tier: f.tier,
    category: f.category,
    lastFollowUp: f.last_follow_up,
    noteSales: f.note_sales,
    dateQuotation: f.date_quotation,
    picQuotation: f.pic_quotation,
    dateInvoice: f.date_invoice,
    picInvoice: f.pic_invoice,
    createdAt: f.created_at,
    updatedAt: f.updated_at
  });

  const mapTarget = (t: any) => ({
    id: t.id,
    monthYear: t.month_year,
    product: t.product,
    targetValue: t.target_value,
    updatedAt: t.updated_at
  });

  return (
    <OIForecastClient 
      leads={allLeads.map(mapLead)}
      user={currentUser as any}
      users={users as any}
      forecasts={(forecasts || []).map(mapForecast)}
      targets={(targets || []).map(mapTarget)}
    />
  );
}
