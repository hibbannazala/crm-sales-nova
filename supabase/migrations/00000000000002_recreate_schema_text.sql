-- ==========================================
-- SUPABASE RE-SCHEMA (MENDUKUNG FIRESTORE ID & DATES)
-- DROP SEMUA TABEL LAMA DAN BUAT ULANG DENGAN TIPE TEXT UNTUK ID
-- ==========================================

-- 1. DROP ALL EXISTING TABLES
DROP TABLE IF EXISTS oi_forecasts CASCADE;
DROP TABLE IF EXISTS global_audit_logs CASCADE;
DROP TABLE IF EXISTS individual_targets CASCADE;
DROP TABLE IF EXISTS global_targets CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS edit_requests CASCADE;
DROP TABLE IF EXISTS funnel_history CASCADE;
DROP TABLE IF EXISTS lead_notes CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS oi_targets CASCADE;

-- 2. CREATE TABLES WITH TEXT IDs

CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Firebase Auth UID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role user_role PRIMARY KEY,
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_set_targets BOOLEAN DEFAULT FALSE,
  can_approve_edits BOOLEAN DEFAULT FALSE,
  can_assign_pic BOOLEAN DEFAULT FALSE,
  can_delete_leads BOOLEAN DEFAULT FALSE,
  can_bulk_delete BOOLEAN DEFAULT FALSE,
  can_edit_funnel_history BOOLEAN DEFAULT FALSE,
  can_delete_funnel_history BOOLEAN DEFAULT FALSE,
  can_clear_all_history BOOLEAN DEFAULT FALSE,
  can_delete_notes BOOLEAN DEFAULT FALSE,
  can_edit_deal_value BOOLEAN DEFAULT FALSE,
  can_import_csv BOOLEAN DEFAULT FALSE
);

CREATE TABLE leads (
  id TEXT PRIMARY KEY, -- Firestore Doc ID
  date_input DATE,
  category TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  lead_source TEXT DEFAULT '-',
  email TEXT,
  status lead_status DEFAULT 'Leads' NOT NULL,
  interest_level interest_level DEFAULT '-' NOT NULL,
  product_offered TEXT[] DEFAULT '{}',
  action_plan TEXT,
  
  date_chated TIMESTAMPTZ,
  date_responsed TIMESTAMPTZ,
  date_set_meeting TIMESTAMPTZ,
  date_closed TIMESTAMPTZ,
  date_failed TIMESTAMPTZ,
  
  deal_value NUMERIC DEFAULT 0,
  
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  auto_delete_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lead_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  author_name TEXT NOT NULL,
  is_log BOOLEAN DEFAULT FALSE,
  note_type TEXT DEFAULT 'note',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE funnel_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, -- Bisa pakai UUID karena ini di-generate baru, tapi pakai text agar seragam
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  date_occurred TIMESTAMPTZ NOT NULL,
  by_user_name TEXT NOT NULL,
  by_user_id TEXT REFERENCES users(id),
  note TEXT,
  assigned_by TEXT,
  deal_value NUMERIC,
  campaign_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE edit_requests (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  old_brand TEXT,
  new_brand TEXT,
  old_contact TEXT,
  new_contact TEXT,
  requested_by_id TEXT REFERENCES users(id),
  requested_by_name TEXT,
  status edit_request_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES users(id)
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority task_priority DEFAULT 'Medium',
  status task_status DEFAULT 'Todo',
  assigned_to TEXT REFERENCES users(id),
  created_by TEXT REFERENCES users(id),
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE global_targets (
  id TEXT PRIMARY KEY,
  month_year TEXT NOT NULL UNIQUE,
  target_chat INTEGER DEFAULT 0,
  target_meeting INTEGER DEFAULT 0,
  target_revenue NUMERIC DEFAULT 0,
  updated_by TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE individual_targets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  target_chat INTEGER DEFAULT 0,
  target_meeting INTEGER DEFAULT 0,
  target_revenue NUMERIC DEFAULT 0,
  updated_by TEXT REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

CREATE TABLE global_audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  target_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oi_forecasts (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  product TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  campaign_number INTEGER,
  budget_ads NUMERIC DEFAULT 0,
  budget_creator NUMERIC DEFAULT 0,
  gross_margin NUMERIC DEFAULT 0,
  real_margin NUMERIC DEFAULT 0,
  real_payment NUMERIC DEFAULT 0,
  target_gmv NUMERIC,
  target_creator NUMERIC,
  target_video_affiliate INTEGER,
  target_video_internal INTEGER,
  target_views INTEGER,
  success_rate NUMERIC DEFAULT 0,
  status forecast_status DEFAULT 'OPEN',
  tier TEXT DEFAULT '-',
  category TEXT,
  last_follow_up TIMESTAMPTZ,
  note_sales TEXT,
  date_quotation DATE,
  pic_quotation TEXT,
  date_invoice DATE,
  pic_invoice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oi_targets (
  id TEXT PRIMARY KEY, 
  month_year TEXT NOT NULL,
  product TEXT NOT NULL,
  target_value NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month_year, product)
);

-- DISABLE RLS FOR MIGRATION (Bisa dinyalakan lagi nanti)
-- Semua data aman disuntikkan tanpa RLS error
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE edit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE oi_forecasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE oi_targets DISABLE ROW LEVEL SECURITY;

-- RECREATE TRIGGERS (Optional tapi bagus untuk updated_at)
DROP TRIGGER IF EXISTS update_users_modtime ON users;
DROP TRIGGER IF EXISTS update_leads_modtime ON leads;
DROP TRIGGER IF EXISTS update_tasks_modtime ON tasks;
DROP TRIGGER IF EXISTS update_oi_forecasts_modtime ON oi_forecasts;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_oi_forecasts_modtime BEFORE UPDATE ON oi_forecasts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
