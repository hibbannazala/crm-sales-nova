-- Functions for Dashboard Metrics to avoid fetching thousands of rows to the client

-- 1. get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_admin TEXT DEFAULT 'ALL',
  p_category TEXT DEFAULT 'ALL',
  p_products TEXT[] DEFAULT '{}',
  p_start_date TIMESTAMPTZ DEFAULT '1970-01-01T00:00:00Z',
  p_end_date TIMESTAMPTZ DEFAULT '2100-01-01T00:00:00Z'
)
RETURNS TABLE (
  total_leads BIGINT,
  total_chated BIGINT,
  total_responsed BIGINT,
  total_set_meeting BIGINT,
  deals_won BIGINT,
  lost_deals BIGINT,
  failed_deals BIGINT,
  total_revenue NUMERIC
) AS $$
DECLARE
  v_total_leads BIGINT := 0;
  v_total_chated BIGINT := 0;
  v_total_responsed BIGINT := 0;
  v_total_set_meeting BIGINT := 0;
  v_deals_won BIGINT := 0;
  v_lost_deals BIGINT := 0;
  v_failed_deals BIGINT := 0;
  v_total_revenue NUMERIC := 0;
BEGIN
  -- We use a CTE or temp table, but for performance we can do conditional aggregation
  
  -- Total Leads: Filtered only by category, product, and admin existence
  -- Total Leads: Filtered by category, product, admin existence, AND date of 'Leads' stage
  SELECT COUNT(DISTINCT l.id) INTO v_total_leads
  FROM leads l
  LEFT JOIN funnel_history fh ON fh.lead_id = l.id
  WHERE 
    l.is_deleted = false
    AND (p_category = 'ALL' OR l.category = p_category)
    AND (array_length(p_products, 1) IS NULL OR l.product_offered && p_products)
    AND (
      p_start_date = '1970-01-01T00:00:00Z' OR 
      (fh.stage = 'Leads' AND fh.date_occurred >= p_start_date AND fh.date_occurred <= p_end_date)
    )
    AND (p_admin = 'ALL' OR EXISTS (SELECT 1 FROM funnel_history f2 WHERE f2.lead_id = l.id AND f2.by_user_name = p_admin AND f2.date_occurred >= p_start_date AND f2.date_occurred <= p_end_date));

  -- Pipeline metrics: Requires matching date and admin on the specific stage
  WITH valid_leads AS (
    SELECT DISTINCT l.id, l.deal_value, l.status
    FROM leads l
    WHERE l.is_deleted = false
      AND (p_category = 'ALL' OR l.category = p_category)
      AND (array_length(p_products, 1) IS NULL OR l.product_offered && p_products)
  ),
  stage_counts AS (
    SELECT 
      vl.id,
      vl.deal_value,
      vl.status,
      bool_or(fh.stage = 'Chated') AS has_chated,
      bool_or(fh.stage = 'Responsed') AS has_responsed,
      bool_or(fh.stage = 'Set Meeting') AS has_set_meeting,
      bool_or(fh.stage = 'Close Win') AS has_close_win,
      bool_or(fh.stage = 'Close Lost') AS has_close_lost,
      bool_or(fh.stage = 'Failed') AS has_failed,
      MAX(CASE WHEN fh.stage = 'Close Win' THEN COALESCE(fh.deal_value, vl.deal_value) ELSE 0 END) as win_revenue
    FROM valid_leads vl
    JOIN funnel_history fh ON fh.lead_id = vl.id
    WHERE 
      fh.date_occurred >= p_start_date AND fh.date_occurred <= p_end_date
      AND (p_admin = 'ALL' OR fh.by_user_name = p_admin)
    GROUP BY vl.id, vl.deal_value, vl.status
  )
  SELECT 
    COUNT(NULLIF(has_chated, false)),
    COUNT(NULLIF(has_responsed, false)),
    COUNT(NULLIF(has_set_meeting, false)),
    COUNT(NULLIF(has_close_win, false)),
    COUNT(NULLIF(has_close_lost, false)),
    COUNT(NULLIF(has_failed, false)),
    SUM(CASE WHEN has_close_win THEN win_revenue ELSE 0 END)
  INTO 
    v_total_chated, v_total_responsed, v_total_set_meeting, v_deals_won, v_lost_deals, v_failed_deals, v_total_revenue
  FROM stage_counts;

  RETURN QUERY SELECT 
    v_total_leads, 
    v_total_chated, 
    v_total_responsed, 
    v_total_set_meeting, 
    v_deals_won, 
    v_lost_deals, 
    v_failed_deals, 
    COALESCE(v_total_revenue, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. get_individual_contributions
CREATE OR REPLACE FUNCTION get_individual_contributions(
  p_admin TEXT DEFAULT 'ALL',
  p_category TEXT DEFAULT 'ALL',
  p_products TEXT[] DEFAULT '{}',
  p_start_date TIMESTAMPTZ DEFAULT '1970-01-01T00:00:00Z',
  p_end_date TIMESTAMPTZ DEFAULT '2100-01-01T00:00:00Z'
)
RETURNS TABLE (
  admin_name TEXT,
  total_chat BIGINT,
  total_meet BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH valid_leads AS (
    SELECT l.id, l.deal_value
    FROM leads l
    WHERE l.is_deleted = false
      AND (p_category = 'ALL' OR l.category = p_category)
      AND (array_length(p_products, 1) IS NULL OR l.product_offered && p_products)
  ),
  admin_stages AS (
    SELECT 
      fh.by_user_name,
      fh.lead_id,
      fh.stage,
      -- Get latest timestamp for this stage by this admin for this lead
      ROW_NUMBER() OVER(PARTITION BY fh.by_user_name, fh.lead_id, fh.stage ORDER BY fh.date_occurred DESC, fh.created_at DESC) as rn,
      COALESCE(fh.deal_value, vl.deal_value, 0) as deal_value
    FROM funnel_history fh
    JOIN valid_leads vl ON vl.id = fh.lead_id
    WHERE fh.date_occurred >= p_start_date AND fh.date_occurred <= p_end_date
      AND (p_admin = 'ALL' OR fh.by_user_name = p_admin)
  )
  SELECT 
    a.by_user_name,
    COUNT(NULLIF(a.stage = 'Chated', false)) as total_chat,
    COUNT(NULLIF(a.stage = 'Set Meeting', false)) as total_meet,
    SUM(CASE WHEN a.stage = 'Close Win' THEN a.deal_value ELSE 0 END) as total_revenue
  FROM admin_stages a
  WHERE a.rn = 1
  GROUP BY a.by_user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. get_ghosted_leads
CREATE OR REPLACE FUNCTION get_ghosted_leads(
  p_admin TEXT DEFAULT 'ALL',
  p_category TEXT DEFAULT 'ALL',
  p_products TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
  lead_id UUID,
  brand_name TEXT,
  pic_name TEXT,
  category TEXT,
  status lead_status,
  last_stage_date TIMESTAMPTZ,
  last_stage TEXT,
  days_passed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_history AS (
    SELECT 
      fh.lead_id,
      fh.stage,
      fh.date_occurred,
      fh.by_user_name,
      ROW_NUMBER() OVER(PARTITION BY fh.lead_id ORDER BY fh.date_occurred DESC, fh.created_at DESC) as rn
    FROM funnel_history fh
  )
  SELECT 
    l.id,
    l.brand_name,
    l.pic_name,
    l.category,
    l.status,
    lh.date_occurred,
    lh.stage,
    EXTRACT(DAY FROM (NOW() - lh.date_occurred))::INTEGER as days_passed
  FROM leads l
  JOIN latest_history lh ON lh.lead_id = l.id AND lh.rn = 1
  WHERE l.is_deleted = false
    AND l.status NOT IN ('Close Win', 'Close Lost', 'Failed')
    AND EXTRACT(DAY FROM (NOW() - lh.date_occurred)) >= 10
    AND (p_category = 'ALL' OR l.category = p_category)
    AND (array_length(p_products, 1) IS NULL OR l.product_offered && p_products)
    AND (p_admin = 'ALL' OR lh.by_user_name = p_admin)
  ORDER BY days_passed DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
