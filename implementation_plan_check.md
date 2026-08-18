# Plan: Dynamic Permissions + Legacy v2 Import

## Fitur 1: Dynamic Permission Management (Lord)

### Konsep
Lord bisa buka halaman "Permission Settings" dan **ceklis** apa saja yang boleh dilakukan Admin dan Staff. Disimpan di Firestore dan di-load realtime.

### Data Model — Firestore `settings/permissions`
```json
{
  "admin": {
    "canManageUsers": false,
    "canSetTargets": false,
    "canAssignPIC": true,
    "canDeleteLeads": true,
    "canBulkDelete": true,
    "canEditFunnelHistory": false,
    "canDeleteFunnelHistory": false,
    "canClearAllHistory": false,
    "canDeleteNotes": false,
    "canEditDealValue": true,
    "canApproveEdits": true,
    "canImportCSV": true
  },
  "staff": {
    "canManageUsers": false,
    "canSetTargets": false,
    "canAssignPIC": false,
    "canDeleteLeads": false,
    "canBulkDelete": false,
    "canEditFunnelHistory": false,
    "canDeleteFunnelHistory": false,
    "canClearAllHistory": false,
    "canDeleteNotes": false,
    "canEditDealValue": false,
    "canApproveEdits": false,
    "canImportCSV": true
  }
}
```

> Lord selalu punya SEMUA akses (hardcoded, tidak bisa di-uncheck).

### UI — Halaman Baru "Permission Settings"
- Di sidebar, tambah menu **"Permissions"** (hanya muncul untuk Lord)
- Halaman: tabel 2 kolom (Admin | Staff) dengan toggle/checkbox per baris
- Lord tinggal centang/uncentang → auto-save ke Firestore

### Implementasi
1. Tambah type `RolePermissions` di `types.ts`
2. Load permissions di `App.tsx` via `onSnapshot`
3. Pass `permissions` ke semua komponen yang butuh
4. Ganti semua `user.role === 'lord'` / `isAdmin` check dengan `permissions[role].canXYZ`
5. Buat komponen `PermissionSettings.tsx` — UI checklist
6. Tambah menu di `Sidebar.tsx`

---

## Fitur 2: Legacy Master Database v2 Import

### Format CSV (dari gambar)

**Kolom umum:**
| No. | Date | Seller | Product | Phone Number |

**Kolom per-rep FIDAL:**
| SUMBER INI (fidal) | NOTES INI (fidal) | STATUS INI (fidal) | MINAT INI (fidal) | PROGRESS STATUS (fidal) | NEXT ACTION PLAN (fidal) | Tgl Chated INI (fidal) | Tgl Responsed INI (fidal) | Tgl Meeting INI (fidal) | Tgl Closing INI (fidal) |

**Kolom per-rep JEFF:**
| SUMBER INI (jeff) | NOTES INI (jeff) | STATUS INI (jeff) | MINAT INI (jeff) | TEMPLATE CHAT (jeff) | NEXT ACTION PLAN (jeff) | Tgl Chated INI (jeff) | Tgl Responsed INI (jeff) | Tgl Meeting INI (jeff) | Tgl Closing INI (jeff) |

**Kolom akhir:**
| Kategory Brand |

### Logic Import
- Satu baris CSV = satu lead (brand)
- **Seller** = nama brand di kolom Seller
- **Product** = produk yang ditawarkan → mapping ke `productOffered`
- **Phone Number** = kontak
- **Kategory Brand** = kategori lead (TAP Brand, Brand, dll)
- Untuk setiap rep (Fidal, Jeff): kalau ada data di kolom STATUS → buat funnel history entry dengan PIC = nama rep
- Ambil status **terakhir/terbaru** dari rep yang ada data sebagai status final lead

### Implementasi
1. Tambah opsi `"Legacy Master Database v2"` di ImportModal
2. Parse kolom-kolom spesifik per rep
3. Map ke Lead schema yang sudah ada
4. Handle template CSV download untuk format v2

---

## Proposed Changes

### Types & Data
#### [NEW] Permission types di [types.ts](file:///d:/CRM-SALES-TNT/src/types.ts)

---

### Core App
#### [MODIFY] [App.tsx](file:///d:/CRM-SALES-TNT/src/App.tsx)
- Load permissions dari Firestore
- Pass permissions ke semua child components
- Tambah route untuk `permissions` view

---

### Permission Settings (Baru)
#### [NEW] [PermissionSettings.tsx](file:///d:/CRM-SALES-TNT/src/components/PermissionSettings.tsx)
- Tabel 2 kolom dengan toggle per permission
- Auto-save ke Firestore

---

### Sidebar
#### [MODIFY] [Sidebar.tsx](file:///d:/CRM-SALES-TNT/src/components/Sidebar.tsx)
- Tambah menu "Permissions" (lord only)
- Sesuaikan menu visibility berdasarkan permissions

---

### All Components — Permission Checks
#### [MODIFY] Multiple files
- Ganti hardcoded role check → permission-based check
- Files: StatusModal, BulkStatusModal, LeadsTable, LeadDetail, Dashboard, etc.

---

### Import Modal
#### [MODIFY] [ImportModal.tsx](file:///d:/CRM-SALES-TNT/src/components/ImportModal.tsx)
- Tambah tab/opsi "Legacy Master Database v2"
- Parse format CSV dari gambar
- Handle per-rep columns (Fidal & Jeff)

---

## Open Questions

> [!IMPORTANT]
> 1. **CSV v2 — Apakah hanya Fidal dan Jeff yang ada di format ini?** Tidak ada kolom untuk Alvin dan Rayhan? (Dari gambar sepertinya memang hanya Fidal & Jeff)
> 2. **Product column di CSV** — Isinya apa? Langsung "TNT" / "Basemen"? Atau format lain?
> 3. **Kalau Fidal DAN Jeff sama-sama punya data untuk 1 brand** — siapa yang jadi PIC final? Yang statusnya paling maju?
