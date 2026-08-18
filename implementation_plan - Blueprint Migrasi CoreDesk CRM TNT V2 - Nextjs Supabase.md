# Blueprint Migrasi: CoreDesk CRM TNT V2 -> Next.js & Supabase

Rencana implementasi ini disusun berdasarkan hasil **Audit Menyeluruh (Deep Code Audit)** terhadap keseluruhan repositori. Tujuan utama blueprint ini adalah untuk **menjamin 100% tidak ada fitur yang hilang (Feature Parity)** dan memastikan transisi menuju Next.js (Frontend & Server) + Supabase (Database Relasional SQL) berjalan mulus tanpa mengganggu data operasional.

## Daftar Fitur yang Dijamin Tidak Akan Hilang (Feature Parity Guarantee)

Berdasarkan analisis file UI (seperti `ImportModal.tsx`, `Dashboard.tsx`, `LeadDetail.tsx`, dll) dan model data (`types.ts`), fitur-fitur berikut telah dipetakan dan akan dimigrasikan secara utuh dengan performa yang ditingkatkan:

1.  **Sistem Keamanan & Otorisasi Bertingkat (RBAC)**
    *   Sistem tingkatan peran pengguna: **Lord** (Super Admin), **Admin**, dan **Staff**.
    *   Sistem perizinan dinamis (*Dynamic Permissions*) seperti *canManageUsers*, *canSetTargets*, *canApproveEdits*, *canBulkDelete*.
2.  **Manajemen Prospek (Leads Management)**
    *   Status Corong (*Funnel Status*): *Leads, Chated, Responsed, Set Meeting, Hold, Close Win, Close Lost, Failed*.
    *   Klasifikasi minat (*Interest Level*) & Produk (*Product Offered*).
    *   Perekaman mendetail Riwayat Corong (*Funnel History*) beserta catatan dan tanggal spesifik.
3.  **Pengolahan Data Massal (Bulk Operations)**
    *   *Bulk Import CSV* dengan fitur canggih seperti mode impor (Basic, Individu, Legacy), deteksi duplikat, komparasi *history* lama & baru, serta koreksi format tanggal otomatis.
    *   *Bulk Status Update* & *Bulk Delete* untuk perombakan data skala besar.
4.  **Target & Analitik Penjualan (Dashboard)**
    *   Pelacakan Target Global (*Global Targets*) dan Target Individu staf.
    *   Visualisasi pencapaian Chat, Meeting, dan Revenue (Omset).
5.  **Modul Proyeksi Finansial (OI Forecast)**
    *   Kalkulasi otomatis *Gross Margin*, Anggaran Iklan (*Ads*), Anggaran Kreator, dan *Real Margin*.
6.  **Alur Persetujuan & Jejak Audit (Approval & Audit Trail)**
    *   Sistem di mana Staf meminta izin (*Edit Requests*) untuk mengubah nama Brand / Kontak.
    *   *Global Audit Logs* untuk memantau siapa mengubah/menghapus apa dan kapan.
7.  **Manajemen Tugas (Task Management)**
    *   Pendelegasian tugas ke sesama pengguna dengan tingkat prioritas (Rendah/Sedang/Tinggi) dan batas waktu (*Due Date*).

> [!TIP]
> **Kabar Baik**: Dengan beralih ke Supabase SQL, fitur-fitur berat seperti *Bulk Import CSV* yang saat ini rawan *freeze* (macet) di browser akan **dipindahkan ke Server Next.js**, sehingga komputer Anda tidak akan terbebani lagi.

---

## Tahapan Implementasi (Migration Strategy)

Proses migrasi tidak akan mengganggu sistem yang sedang berjalan. Anda bisa menggunakan sistem baru secara paralel sebelum mematikan yang lama.

### Fase 1: Desain Skema Database Relasional (Supabase)
Menerjemahkan koleksi NoSQL Firestore menjadi Tabel SQL PostgreSQL yang rapi.
*   Pembuatan tabel relasional: `users`, `leads`, `funnel_history`, `tasks`, `audit_logs`, `targets`, dan `oi_forecasts`.
*   Penerapan **Foreign Keys** agar data terikat konsisten (misal: Jika pengguna dihapus, tugasnya otomatis terhapus).
*   Penerapan **Row Level Security (RLS)** untuk memastikan staf hanya bisa mengakses data yang diizinkan sesuai perannya.

### Fase 2: Setup Next.js & Server Actions
*   Membuat proyek **Next.js 15 (App Router)** baru di dalam sub-direktori (atau repositori terpisah).
*   Membangun fungsi *Backend* tersembunyi (Server Actions) khusus untuk menangani operasi berat seperti membaca CSV dan memanipulasi ribuan *lead* tanpa macet.
*   Menggunakan library **Zustand** sebagai manajemen *state* global agar kode `App.tsx` tidak lagi bengkak.

### Fase 3: Migrasi Antarmuka (User Interface)
*   Memindahkan desain Tailwind CSS yang sudah ada persis 1:1.
*   Mengubah *God Components* (komponen raksasa seperti `ImportModal.tsx` yang berisi 1400 baris kode) menjadi kumpulan sub-komponen kecil yang mudah di-*maintenance*.

### Fase 4: Export-Import Data Asli (Cut-Over)
*   Menjalankan *script* lokal sekali pakai (*one-time script*) untuk menyedot data dari Firebase yang lama dan menyuntikkannya ke Supabase yang baru tanpa ada kehilangan satu karakter pun.

---

## User Review Required

> [!WARNING]
> Sebelum saya menyentuh baris kode apa pun atau membuat proyek Next.js, saya memerlukan persetujuan Anda terhadap *Blueprint* ini.
> Apakah ada **fitur rahasia atau fitur yang terlewat** dari daftar di atas yang penting bagi Anda? Jika tidak, silakan klik **Proceed** dan saya akan mulai mengerjakan **Fase 1**.
