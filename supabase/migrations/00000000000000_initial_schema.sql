-- ==========================================
-- SUPABASE INITIAL SCHEMA: CORE DESK CRM TNT
-- ==========================================

-- 1. ENUMS (Tipe Data Khusus)
CREATE TYPE user_role AS ENUM ('lord', 'admin', 'staff', 'pending');
CREATE TYPE lead_status AS ENUM ('Leads', 'Chated', 'Responsed', 'Set Meeting', 'Hold', 'Close Win', 'Close Lost', 'Failed');
CREATE TYPE interest_level AS ENUM ('HOT', 'WARM', 'COLD', '-');
CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE task_status AS ENUM ('Todo', 'In Progress', 'Done');
CREATE TYPE edit_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE forecast_status AS ENUM ('WIN', 'OPEN', 'LOSE');

-- 2. TABLES

-- Tabel Users (Berelasi dengan auth.users milik Supabase)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Pengaturan Izin Khusus (Role Permissions)
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

-- Tabel Leads Utama
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_input DATE NOT NULL,
  category TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  lead_source TEXT DEFAULT '-',
  email TEXT,
  status lead_status DEFAULT 'Leads' NOT NULL,
  interest_level interest_level DEFAULT '-' NOT NULL,
  product_offered TEXT[] DEFAULT '{}',
  action_plan TEXT,
  
  -- Tracking tanggal per status
  date_chated TIMESTAMPTZ,
  date_responsed TIMESTAMPTZ,
  date_set_meeting TIMESTAMPTZ,
  date_closed TIMESTAMPTZ,
  date_failed TIMESTAMPTZ,
  
  deal_value NUMERIC DEFAULT 0,
  
  -- Soft Delete System
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  auto_delete_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Catatan Lead (Menggantikan properti notes: Note[] di Firestore)
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  author_name TEXT NOT NULL,
  is_log BOOLEAN DEFAULT FALSE,
  note_type TEXT DEFAULT 'note', -- 'note' or 'action_plan'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Funnel History (Menggantikan sub-collection history)
CREATE TABLE funnel_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  date_occurred TIMESTAMPTZ NOT NULL,
  by_user_name TEXT NOT NULL,
  by_user_id UUID REFERENCES users(id), -- Nullable untuk history lama
  note TEXT,
  assigned_by TEXT,
  deal_value NUMERIC,
  campaign_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Edit Requests (Approval perubahan kontak/brand)
CREATE TABLE edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  old_brand TEXT,
  new_brand TEXT,
  old_contact TEXT,
  new_contact TEXT,
  requested_by_id UUID REFERENCES users(id),
  requested_by_name TEXT,
  status edit_request_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Tabel Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority task_priority DEFAULT 'Medium',
  status task_status DEFAULT 'Todo',
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id) NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Global Targets
CREATE TABLE global_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year TEXT NOT NULL UNIQUE, -- Format: YYYY-MM
  target_chat INTEGER DEFAULT 0,
  target_meeting INTEGER DEFAULT 0,
  target_revenue NUMERIC DEFAULT 0,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Individual Targets
CREATE TABLE individual_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  target_chat INTEGER DEFAULT 0,
  target_meeting INTEGER DEFAULT 0,
  target_revenue NUMERIC DEFAULT 0,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Tabel Global Audit Logs
CREATE TABLE global_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  target_id UUID, -- Fleksibel, bisa lead_id, task_id, dll
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel OI Forecasts
CREATE TABLE oi_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
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

-- ==========================================
-- 3. TRIGGERS UNTUK UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_oi_forecasts_modtime BEFORE UPDATE ON oi_forecasts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) - DASAR
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oi_forecasts ENABLE ROW LEVEL SECURITY;

-- Contoh Kebijakan (Policies) Dasar:
-- 1. Semua pengguna yang terotentikasi bisa membaca daftar pengguna
CREATE POLICY "Allow authenticated to read users" ON users FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Staff/Admin/Lord bisa membaca seluruh leads (sesuai struktur Firestore awal, disaring di level aplikasi nanti jika perlu)
CREATE POLICY "Allow authorized to read leads" ON leads FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role != 'pending'));
CREATE POLICY "Allow authorized to modify leads" ON leads FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role != 'pending'));

-- RLS yang jauh lebih kompleks dan presisi akan dibangun pada konfigurasi tahap lanjut.
