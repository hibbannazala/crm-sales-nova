# Rencana Peningkatan Sistem Anti-Duplikat & Import Individu

Berikut adalah rencana teknis berdasarkan permintaan Anda mengenai struktur impor baru per-orang (Individu) dan penanganan duplikasi data ganda (*Anti-Double System*).

## User Review Required
> [!IMPORTANT]
> Mohon baca **Open Questions** di bagian bawah dan konfirmasi apakah alur logika (*logic*) deduplikasi ini sudah sesuai dengan ekspektasi Anda sebelum saya mulai menulis kode!

## Proposed Changes

### 1. `src/components/ImportModal.tsx`
- **Tipe File Upload Baru (Mode Individu):**
  - Akan ada *dropdown* baru untuk memilih strategi **"Pilih PIC (Nama Sales)"**.
  - Template CSV akan disesuaikan khusus untuk PIC. Kolomnya menjadi: `Tanggal` | `No.` | `Nama Brand` | `No.WA` | `Status` | `Minat` | `Tgl Chated` | `Tgl Responsed` | `Tgl Set Meeting` | `Tgl Close Win` | `Notes` | `Action Plan`.
- **Deduplikasi Otomatis (Batch):**
  - Sistem akan membaca sekumpulan database yang ada sebelum mulai *import*.
  - Jika `Nama Brand` & `No. WA` di CSV **SAMA PERSIS** dengan di database → *Update* data Funnel/History/Tanggal/Notes di database yang lama (tidak membuat row baru).
  - Jika `Nama Brand` **SAMA**, tapi `No. WA` **BEDA** → (Di proses import masal, sebaiknya kita *overwrite/update* WA lama di database dengan WA baru yang dari CSV agar tidak muncul *error pop-up* berkali-kali).

### 2. `src/components/LeadModal.tsx` (Tambah Lead Manual)
- **Deteksi Duplikat Instan:**
  - Saat menekan tombol "Simpan", sistem akan melakukan pencarian spesifik ke `Nama Brand` yang diinput.
  - Jika ada `Nama Brand` & `No. WA` yang **identik** → Akan ditolak (Diberi pesan: *"Data sudah ada!"*).
  - Jika `Nama Brand` **SAMA** tapi `No. WA` **BEDA** → Akan muncul `ConfirmModal` (Pop-Up Peringatan): *"Brand ini sudah ada dengan WA: 0812xxx. Nomor yang Anda input: 08999. Apakah Anda ingin mengupdate Nomor WA ini dan mencatat riwayat perubahannya?"*
  - Jika Tim Sales klik "Update", maka data WA yang lama akan diganti dengan yang baru, dan tercatat di tab *Notes*: `"Nomor kontak diperbarui dari 0812xxx menjadi 08999 oleh {nama_sales}"`.

### 3. `src/types.ts` & `firebase-blueprint.json`
- Memastikan struktur kolom Funnel History dan *Action Plan* terdukung penuh untuk pencatatan *update*.
- Memperbarui *Changelog* supaya AI Agent berikutnya tahu apa yang terjadi hari ini.

## Open Questions

> [!WARNING]
> **Pertanyaan Terkait Import Masal (CSV):**
> Saat Tim Sales meng-upload file Excel dan di dalamnya ada **Nama Brand yang sama tapi No WA-nya berbeda** dari data di CRM. Apakah sistem harus meng-*update* otomatis WA di CRM mengikuti Excel tersebut? Atau abaikan nomor WA-nya dan cukup tambahkan log *history*-nya saja?

> [!TIP]
> **Terkait "No.":**
> Format CSV yang Anda ajukan memiliki kolom "No." (Nomor urut). Fitur ini akan kami sediakan di CSV, tetapi tentu kolom `No.` dari Excel ini akan diabaikan saja saat masuk ke sistem karena Firebase sudah punya urutan otomatisnya (`dateInput`). Apakah ini sesuai?

Jika Anda setuju dengan *mapping* alur di atas, silakan beri konfirmasi atau jawab *Open Questions* agar saya bisa langsung *Gas* eksekusi!
