# Audit Mendalam & Dokumentasi Sistem: Executive Dashboard (`/`)

Dokumen ini mencatat arsitektur sistem, alur data, relasi antar-komponen, temuan celah/bug kritis, serta solusi teknis pada modul **Executive Dashboard (Performance Scorecard)**.

---

## 1. Arsitektur & Relasi Antar Kode

```
[app/page.tsx (Server Component)]
   ├── Auth & Role Verification (users table)
   ├── Fetch Users List (users table)
   ├── Fetch Global Targets (global_targets table)
   ├── Fetch Individual Targets (individual_targets table)
   └── Render <DashboardClient />
          │
          ├── 1. Header & Filter Bar
          │      ├── Search Input (Brand / WA)
          │      ├── Filter Team Member (admins dropdown)
          │      ├── Filter Category (categories dropdown)
          │      ├── Date Range Filter (filterStart - filterEnd / All Time)
          │      └── Product Filter Strip (TNT / MCN / HYPE)
          │
          ├── 2. Top Scorecard & Conversion Success
          │      └── Data Source: Supabase RPC `get_dashboard_stats`
          │
          ├── 3. Individual Target Contribution
          │      └── Data Source: Supabase RPC `get_individual_contributions` + `individualTargets`
          │
          ├── 4. Leads Pipeline Table (Paginated 30 rows/page)
          │      ├── Data Source: Supabase `.from('leads').select('*, funnelHistory:funnel_history(*)')`
          │      └── Bulk Action: <BulkStatusModal />
          │
          └── 5. Ghosted Lead Alert
                 └── Data Source: Leads non-closed dengan aktivitas terakhir >= 14 hari
```

---

## 2. Daftar Temuan Masalah & Celah Kritis (Root Cause Analysis)

### Temuan 1: Seluruh Kartu KPI Atas Menampilkan Angka `0` (Critical Bug)
- **Gejala di UI**: `TOTAL LEADS: 0`, `CHATED OUT: 0`, `RESPONSES: 0`, `MEETINGS SET: 0`, `0 Deals Won`, `Rp 0`, dan `Response/Interest/Efficiency Rate: 0%` — padahal di tabel bawah ada 545 leads dan di database bulan September 2026 tercatat **386 Leads, 179 Chated, 25 Responsed, 25 Set Meeting, 24 Deals Won, dan Revenue Rp 442.985.156**.
- **Akar Masalah**:
  - Di `app/page.tsx` baris 71, prop `leads={[]}` dikirim kosong untuk mencegah browser membekukan memori akibat memuat 6.000+ baris sekaligus.
  - Di `DashboardClient.tsx` baris 66–81, hasil RPC `get_dashboard_stats` sudah diambil dan disimpan ke state `dashboardStats`.
  - **NAMUN**, komponen JSX di baris 581–640 masih me-render variabel lama `stats.total`, `stats.chated`, `stats.responsed`, `stats.meeting`, `stats.win`, `stats.revenue`, dan `rates` yang dihitung dari `leads` (yang isinya array kosong `[]`).
- **Solusi**: Hubungkan seluruh kartu `StatCard`, `Conversion Success`, dan kalkulasi `rates` langsung ke state `dashboardStats`.

---

### Temuan 2: Fitur Pencarian (`Search Brand/WA...`) Error Database 42703
- **Gejala di UI**: Saat mengetik nama brand atau nomor WA di kolom pencarian, tabel tidak memfilter hasil apa pun.
- **Akar Masalah**:
  - Di `DashboardClient.tsx` baris 120, query menggunakan:
    `query.or('brand_name.ilike.%${search}%,pic_name.ilike.%${search}%,contact.ilike.%${search}%')`
  - Tabel `leads` di PostgreSQL **tidak memiliki kolom `pic_name`** (nama PIC berada di tabel relasi `funnel_history.by_user_name`).
  - Akibatnya, PostgreSQL mengembalikan error `42703: column leads.pic_name does not exist`.
- **Solusi**: Ubah query `.or()` menjadi `brand_name.ilike.%${search}%,contact.ilike.%${search}%`.

---

### Temuan 3: Ghosted Lead Alert Selalu Menampilkan "Aman Terkendali!" (Error 42703 + Salah Variabel State)
- **Gejala di UI**: Panel Ghosted Lead Alert selalu hijau ("Aman Terkendali!"), padahal di database terdapat **165 lead** yang sudah stagnant $\ge 14$ hari tanpa follow-up.
- **Akar Masalah**:
  1. Fungsi RPC PostgreSQL `get_ghosted_leads` memanggil `SELECT l.pic_name FROM leads l`, yang gagal karena kolom `pic_name` tidak ada di tabel `leads`.
  2. Di `DashboardClient.tsx` baris 1024, JSX me-render variabel `stagnantLeads` (yang dihitung dari prop `leads={[]}` kosong) alih-alih state `ghostedAlerts`.
- **Solusi**:
  - Ambil data Ghosted Leads secara langsung melalui query `leads` + `funnel_history` untuk status `['Hold', 'Chated', 'Responsed', 'Set Meeting']` dan hitung selisih hari $\ge 14$ hari, lalu render `ghostedAlerts` di UI.

---

### Temuan 4: Dropdown Filter "All Categories" Kosong
- **Gejala di UI**: Ketika klik dropdown `All Categories`, tidak ada pilihan kategori industri sama sekali (padahal di database ada 16 kategori seperti `FOOD`, `Health`, `Beauty/Makeup`, `Application`, dll).
- **Akar Masalah**:
  - Di `DashboardClient.tsx` baris 244, daftar `categories` di-generate dari `leads.forEach(l => cats.add(l.category))`. Karena `leads` bernilai `[]`, maka `categories` selalu kosong.
- **Solusi**: Fetch daftar kategori unik di `app/page.tsx` atau saat mount di `DashboardClient.tsx` sehingga ke-16 kategori muncul lengkap di dropdown.

---

### Temuan 5: Target Mingguan & Target Global Selalu "Belum Diset" (Silent Fail di Menu Set Targets + Unmapped Props)
- **Gejala di UI**: Di kartu *Individual Target Contribution*, semua sales bertuliskan `TARGET MINGGUAN: BELUM DISET` dan muncul pesan `Belum ada target global di set untuk bulan 2026-09`.
- **Akar Masalah (3 Lapis Bug)**:
  1. **Foreign Key Error di `global_targets`**: Di `AdminTargetsClient.tsx` baris 75, saat menyimpan target global, kode mengirim `updated_by: user.name` (contoh: `"Hibban Nazala"`). Padahal kolom `updated_by` memiliki constraint `REFERENCES users(id)` (harus berupa ID/UID user, bukan nama). Query gagal dengan error `23503`, namun karena tidak ada pengecekan `if (error) throw error`, muncul notif palsu *"Target global berhasil disimpan"* padahal gagal masuk database!
  2. **Salah Nama Tabel di `individual_targets`**: Di `AdminTargetsClient.tsx` baris 95 & `app/admin/targets/page.tsx` baris 17, kode menyimpan dan membaca target individu sales ke tabel `oi_targets` (tabel khusus OI Forecast produk) alih-alih tabel `individual_targets`! Karena kolomnya berbeda (`user_id`, `target_chat` tidak ada di `oi_targets`), penyimpanan selalu gagal secara diam-diam (*silent fail*).
  3. **Tidak Ada Mapping `snake_case` ke `camelCase` di `app/page.tsx`**: Di `app/page.tsx` baris 63–64, data `global_targets` dan `individual_targets` dikirim mentah ke `DashboardClient` tanpa memetakan `month_year` $\to$ `monthYear`, `user_id` $\to$ `userId`, `target_chat` $\to$ `targetChat`, `target_meeting` $\to$ `targetMeeting`, `target_revenue` $\to$ `targetRevenue`.

---

### Temuan 6: Tombol "Update Massal" (Bulk Status Modal) Tidak Berfungsi di Dashboard
- **Gejala di UI**: Saat mencentang beberapa baris di tabel *Leads Pipeline* lalu menekan tombol **Update Massal**, modal tidak memproses lead yang dipilih.
- **Akar Masalah**:
  - Di `DashboardClient.tsx` baris 1099:
    `selectedLeads={leads.filter(l => selectedLeadIds.includes(l.id))}`
  - Karena `leads` adalah `[]`, maka `selectedLeads` selalu kosong `[]`.
- **Solusi**: Gunakan `paginatedTableLeads.filter(l => selectedLeadIds.includes(l.id))`.

---

### Temuan 7: Perbedaan Definisi Angka "Total Leads" (386) vs "Leads Pipeline Total" (545)
- **Penjelasan Logika**:
  - Kartu **TOTAL LEADS (386)** menghitung jumlah lead yang memiliki riwayat tahap `'Leads'` (lead baru masuk) pada rentang tanggal yang dipilih.
  - Tabel **Leads Pipeline (545 total)** menampilkan seluruh lead yang memiliki **aktivitas tahap apapun** (termasuk lead bulan lalu yang baru di-chat, meeting, atau closing di bulan ini).
  - Selisih 159 lead adalah lead lama (carry-over) yang aktif dikerjakan oleh tim di bulan berjalan.

---

## 3. Status Implementasi & Perbaikan yang Telah Selesai Diterapkan

Seluruh 7 temuan di atas telah **SELESAI DIPERBAIKI DAN DIVERIFIKASI** pada tanggal **29 September 2026**:

1. **Scorecard & Conversion Success Terhubung Penuh**:
   - File: `next-crm/src/components/DashboardClient.tsx`
   - Menghubungkan kartu `TOTAL LEADS`, `CHATED OUT`, `RESPONSES`, `MEETINGS SET`, `Conversion Success`, dan `Lost Deals` ke state `dashboardStats` (dari RPC `get_dashboard_stats`).
   - Rumus kalkulasi konversi diperbarui:
     - `Response Rate` = `(Responses ÷ Chated) × 100%`
     - `Interest Rate` = `(Meetings Set ÷ Responses) × 100%`
     - `Efficiency Rate` = `(Deals Won ÷ Responses) × 100%`
     - `Global Rate` = `(Deals Won ÷ Total Leads) × 100%`
   - Memperbaiki typo UI dari *"Deals Wan"* menjadi *"Deals Won"*.

2. **Perbaikan Pencarian Brand / Kontak (Error 42703 Sembuh)**:
   - File: `next-crm/src/components/DashboardClient.tsx`
   - Menghapus klausa `pic_name.ilike` dari query tabel `leads` karena kolom `pic_name` tidak ada di tabel `leads`.
   - Pencarian kini berjalan cepat dan aman mencari berdasarkan `brand_name` dan `contact` (nomor WA/telepon).

3. **Perbaikan Ghosted Lead Alert (Real Data, Tanpa RPC Rusak)**:
   - File: `next-crm/src/components/DashboardClient.tsx`
   - Mengganti pemanggilan RPC `get_ghosted_leads` yang error dengan query langsung Supabase client yang memeriksa lead berstatus `Hold`, `Chated`, `Responsed`, atau `Set Meeting` yang tidak memiliki pergerakan aktivitas $\ge 10$ hari.
   - Merender array `ghostedAlerts` ke kartu UI sehingga tim dapat langsung melihat nama brand, nama PIC, jumlah hari tertahan, dan klik untuk membuka detail lead.

4. **Kategori Lengkap Terisi Otomatis**:
   - File: `next-crm/src/components/DashboardClient.tsx`
   - Mengintegrasikan hook `useCategories` ke dalam `DashboardClient.tsx` sehingga seluruh 16 kategori industri aktif termuat di dropdown `All Categories`.

5. **Sistem Target Sales 100% Sembuh**:
   - File: `next-crm/src/components/AdminTargetsClient.tsx`:
     - Memperbaiki constraint foreign key `updated_by` dengan mengirim UUID user (`user.id` / `user.uid`).
     - Mengubah target tabel simpan dari `oi_targets` menjadi `individual_targets`.
     - Menghapus kolom fiktif `user_name` dari payload upsert.
     - Menambahkan proteksi `if (error) throw error` agar error tidak tertelan diam-diam.
   - File: `next-crm/src/app/admin/targets/page.tsx`:
     - Mengubah query fetch target dari `oi_targets` menjadi `individual_targets`.
     - Memetakan nama sales secara dinamis dari tabel `users`.
   - File: `next-crm/src/app/page.tsx`:
     - Memetakan data dari Supabase (`month_year`, `target_chat`, `target_meeting`, `target_revenue`) ke format camelCase (`monthYear`, `targetChat`, `targetMeeting`, `targetRevenue`) yang dibaca oleh `DashboardClient`.
   - File: `next-crm/src/app/leads/page.tsx`:
     - Mengubah query target dari `oi_targets` ke `individual_targets`.

6. **Update Massal (Bulk Status Modal) Berfungsi**:
   - File: `next-crm/src/components/DashboardClient.tsx`
   - Mengubah filter seleksi dari `leads` ke `paginatedTableLeads.filter(l => selectedLeadIds.includes(l.id))`.
   - Menambahkan pemanggilan `fetchDashboardData()` saat update selesai agar tabel dan scorecard langsung auto-refresh tanpa reload halaman.

7. **Optimalisasi Kecepatan & Anti-Lag**:
   - Menghapus join `notes:lead_notes(*)` pada query tabel scorecard. Catatan tidak pernah ditampilkan di baris tabel scorecard, sehingga membuang join ini memangkas beban payload jaringan secara drastis dan menghilangkan lag rendering pada paginasi.

---

## 4. Panduan Operasional Tim Sales & Manajemen

1. **Untuk Admin/Manajemen (Mengatur Target)**:
   - Masuk ke menu **Set Targets** (`/admin/targets`).
   - Pilih bulan berjalan (contoh: September 2026).
   - Masukkan Target Global tim (Total Chat, Meeting, Target Omset Revenue), klik **Simpan Target Global**.
   - Beralih ke tab **Individual**, pilih personil sales (contoh: Bunga, Ezra Destyan, Fitriya, Siti Rahmawati, dll), masukkan target masing-masing, klik **Simpan Target Personil**.
   - Kembali ke Dashboard (`/`), kartu *Individual Target Contribution* akan langsung menampilkan progress bar persentase capaian vs target mingguan secara otomatis.

2. **Untuk Tim Sales (Follow Up & Pipeline)**:
   - Pantau kartu merah **Ghosted Lead Alert** setiap hari untuk memprioritaskan kontak lead yang terhenti $>10$ hari.
   - Gunakan fitur centang dan tombol **Update Massal** untuk memindahkan status beberapa lead sekaligus secara cepat.

