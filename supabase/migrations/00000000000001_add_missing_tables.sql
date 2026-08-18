-- Tabel app_settings untuk menyimpan konfigurasi dinamis
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel oi_targets untuk target spesifik per produk
CREATE TABLE IF NOT EXISTS oi_targets (
  id TEXT PRIMARY KEY, -- Format: {productName}_{monthYear}
  month_year TEXT NOT NULL,
  product TEXT NOT NULL,
  target_value NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month_year, product)
);

-- RLS untuk tabel baru
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE oi_targets ENABLE ROW LEVEL SECURITY;

-- Kebijakan dasar (Bisa diakses oleh admin/staff)
CREATE POLICY "Allow authorized to read app_settings" ON app_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authorized to modify app_settings" ON app_settings FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role != 'pending'));

CREATE POLICY "Allow authorized to read oi_targets" ON oi_targets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authorized to modify oi_targets" ON oi_targets FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role != 'pending'));
