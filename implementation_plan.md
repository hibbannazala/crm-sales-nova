# Enhancing CRM Analytics: Targets & Deal Revenue

Tujuan pembaruan ini difokuskan pada tiga hal utama yang Anda sampaikan:
1.  **Refactoring Rumus Conversion Rate**: Mengubah dasar perhitungan *Conversion Rate* dari Total Leads menjadi Total Chated. Serta menambahkan *tooltip* atau penjelasan pada antarmuka agar transparan.
2.  **Tracking Nominal *Closing***: Menambahkan field baru pada Database Leads untuk menyimpan nilai rupiah (*Deal Value/Revenue*) pada setiap *closing*, sehinggga report yang dihasilkan adalah komulatif nominal (misal Rp 2 Milyar), bukan sekedar angka kuantiti *Close Win*.
3.  **Sistem Target Mingguan/Bulanan Sales**: Membuat kerangka untuk menyimpan dan memonitor target KPI bagi tim Sales (Target Chat Mingguan, Target Meeting Mingguan, Target Revenue Bulanan).
4.  **Updates pada `firebase-blueprint.json`**: Menyelaraskan seluruh perubahan struktur data pada file *blueprint* AI Agent sesuai kondisi *source code* terbaru.

## User Review Required

> [!IMPORTANT]
> **Keputusan Desain**: 
> 1. Saat Sales mengubah status Lead menjadi **"Close Win"**, haruskah sistem memunculkan _pop-up_ wajib untuk mengisi **Nominal Closing (Rp)**? (Saran saya: YA, ini membuat data pendapatan menjadi akurat).
> 2. Untuk fitur **Sistem Target**, apakah Anda ingin menetapkan **Satu Target Global** untuk satu tim, atau **Target Individu** (misal Budi target 500jt, Siti target 1 Milyar)? Pada fase awal ini, saya mengusulkan kita buat **"Target Individu per Bulan"** yang bisa diisi oleh Admin/Lord melalui panel khusus atau Dashboard.

## Proposed Changes

---

### 1. Data Models (`src/types.ts`)
Mengakomodasi kebutuhan penyimpanan *Revenue* dan kerangka Data Target Sales.

#### [MODIFY] `src/types.ts`
- Tambahkan properti opsional `dealValue?: number` pada *interface* `Lead`.
- Buat *interface* baru `SalesTarget` untuk merepresentasikan target.

---

### 2. Modul Core (Status Update & Blueprint)

#### [MODIFY] `firebase-blueprint.json`
- Menambahkan dokumentasi *schema* baru untuk relasi/tabel `/targets/{targetId}`.
- Memperbarui skema entitas `Lead` agar mengikutsertakan `dealValue`.

#### [MODIFY] `src/components/StatusModal.tsx`
- Menambahkan sebuah *input text/number* khusus untuk **Nominal Rupiah (Deal Value)** yang hanya akan muncul ketika User meregistrasikan status ke `"Close Win"`.
- Jika bukan *Close Win*, *input* ditutup. Jika *Close Win*, mewajibkan Sales memasukkan angkanya.

#### [MODIFY] `src/components/LeadModal.tsx`
- Memastikan field `dealValue` juga bisa di-edit oleh Admin/Lord apabila salah memasukkan nominal waktu *closing*.

---

### 3. Analytics Dashboard (`src/components/Dashboard.tsx`)
Pusat eksekusi di mana konversi dan pencapaian target dimonitor secara berkala.

#### [MODIFY] `src/components/Dashboard.tsx`
- **Rumus Conversion**: Memperbarui variabel persentase dari `(win / total)` menjadi `(win / chated)`.
- **Note/Tooltip Info**: Menambahkan label visual atau *tooltip* kecil (`i`) di sebelah teks *Rate* yang berbunyi: "Dihitung berdasarkan (Total Menang ÷ Total Dihubungi)".
- **Revenue Tracker (Baru)**: Menambahkan metrik raksasa atau porsi di visualisasi layar besar untuk mendisplai akumulasi uang masuk (Contoh: **Rp 2.15 B**).
- **Target Progress Section**: Mengambil / meload data `SalesTarget` dari koleksi Firestore, kemudian dikalibrasi (diadu) dengan capaian Admin di bulan berjalan. Menampilkan *Progress Bar* untuk chat, meeting, dan revenue:
  - *Chat Mingguan/Bulanan:* `(Achieved X / Target Y) -> Z%`
  - *Meeting Mingguan/Bulanan:* `(Achieved X / Target Y) -> Z%`
  - *Revenue Bulanan:* `(Rp X / Rp Y) -> Z%`
  
---

## Open Questions

> [!NOTE]
> 1. Pada fitur *"Target perminggunya harus chat/blasting berapa"*, karena rentang filter di Dashboard sangat dinamis (*custom dates*), kita bisa merekam target *Sales* sebagai **Target Bulanan** terlebih dahulu (nanti chat/meeting dibagi 4 disisi layar) agar penyimpanannya rapi. Bagaimana menurut Anda?
> 2. Di layar apa Anda ingin "Mengatur/Menyeting" angka target-target tim Sales ini? Apakah ingin saya buatkan satu tombol / modal *Setting Targets* baru di dalam Dashboard khusus untuk user ber-'role' *lord/admin*?

## Verification Plan

### Manual Verification
- Deploy UI secara lokal.
- Login sebagai Lord/Admin. Membuka _Dashboard_, memeriksa apakah rumus konversi sudah tepat logikanya.
- Membuka menu Leads, lalu mencoba mem-prospek salah satu *Lead* menjadi **Close Win**. Menyatatakan nominal misal `2000000000` (2 Milyar) -> Memeriksa apakah Dashboard menangkap data Rp2.000.000.000 dengan benar.
- Melakukan simulasi pengaturan target di Dashboard dan membandingkan *progress bar* tim.
