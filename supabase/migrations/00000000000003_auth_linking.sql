-- ==========================================
-- SCRIPT: MENGHUBUNGKAN GOOGLE LOGIN (SUPABASE AUTH)
-- DENGAN DATA USERS LAMA (FIRESTORE)
-- ==========================================

-- 1. Tambahkan kolom auth_id untuk menyimpan UUID dari Supabase Auth
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- 2. Buat fungsi otomatis (Trigger Function)
-- Saat user login pakai Google, Supabase Auth akan membuat baris baru di auth.users
-- Fungsi ini akan mencari email tersebut di tabel public.users kita,
-- lalu menempelkan ID barunya ke kolom auth_id.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Cocokkan email dari auth.users dengan email di public.users
  UPDATE public.users
  SET auth_id = new.id
  WHERE email = new.email AND auth_id IS NULL;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Pasang Trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Aktifkan kembali RLS untuk keamanan (Bisa diskip jika belum siap RLS)
-- Menggunakan auth_id sebagai verifikasi identitas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all users" ON public.users;
CREATE POLICY "Users can read all users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- (RLS lain akan diatur nanti, sementara biarkan terbuka untuk baca saja agar UI tidak error)
