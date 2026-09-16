# Graph Report - crm-sales-tnt-v2  (2026-09-16)

## Corpus Check
- 211 files · ~209,253 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1194 nodes · 1756 edges · 139 communities (85 shown, 54 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1adc0f7c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- src/types.ts
- pg
- 00000000000002_recreate_schema_text.sql
- LeadsClient.tsx
- next-crm/package.json
- package.json
- OIForecastClient.tsx
- next-crm/src/types.ts
- createClient
- dependencies
- compilerOptions
- dependencies
- What You Must Do When Invoked
- cn
- compilerOptions
- backup_incremental.cjs
- fix_tasks_ts.cjs
- createClient
- fix_all_ts.cjs
- migrate_from_local.cjs
- next-crm/src/components/Sidebar.tsx
- devDependencies
- UserProfile
- backup_firestore.cjs
- fix_modals_logic.cjs
- port_tasks.cjs
- PermissionSettingsClient.tsx
- devDependencies
- fix_migration.cjs
- fix_tasks_ts_2.cjs
- migrate.cjs
- migrate_remaining.cjs
- patch_oi_forecasts.cjs
- fix_modals_logic3.cjs
- import_missing.cjs
- patch_dates.cjs
- sync_new_history_notes.cjs
- fix_ts_final.cjs
- port_admin_approvals.cjs
- port_admin_targets.cjs
- port_admin_users.cjs
- funnel_history
- inspect_fb.cjs
- scripts
- check_firebase_raw.cjs
- check_firebase_stats.cjs
- check_logic_2.cjs
- check_logic_3.cjs
- check_logic_4.cjs
- check_logic_5.cjs
- compare_latest.cjs
- find_missing.cjs
- find_missing2.cjs
- fix_modals_logic2.cjs
- port_import_modal.cjs
- port_lead_detail.cjs
- refactor_dashboard.cjs
- scripts
- src/middleware.ts
- check_all_datechated.cjs
- check_all_time.cjs
- check_lead_funnel.cjs
- check_status_all.cjs
- check_string.cjs
- extract.cjs
- extract2.cjs
- fix_bulk_modal.cjs
- fix_import_modal.cjs
- force_fix_navigate.cjs
- refactor_leads.cjs
- 00000000000003_auth_linking.sql
- vite.config.ts
- analyze.ts
- check_08hx.cjs
- check_august.cjs
- check_chated_august.cjs
- check_counts.cjs
- check_date.cjs
- check_duplicates.cjs
- check_forecasts.cjs
- check_funnel.cjs
- check_funnel_schema.cjs
- check_id_length.cjs
- check_lead.cjs
- check_limit.cjs
- check_notes.cjs
- check_notes_schema.cjs
- check_rls.cjs
- check_rls_all.cjs
- check_siti.cjs
- check_siti_2.cjs
- check_stats.cjs
- count_chated_total.cjs
- count_dates.cjs
- count_future_dates.cjs
- find_string.cjs
- fix_future_dates.cjs
- get_rpc_def.cjs
- get_rpc_src.cjs
- refactor_firebase.cjs
- run_sql.cjs
- test_client_logic.cjs
- test_rls_as_user.cjs
- test_server_query.cjs
- test_supa.cjs
- firebase-admin
- 00000000000001_add_missing_tables.sql
- eslint.config.mjs
- postcss.config.mjs
- public.users
- Proposed Changes
- DOKUMENTASI SISTEM & ARSITEKTUR LENGKAP
- Enhancing CRM Analytics: Targets & Deal Revenue
- graphify reference: extra exports and benchmark
- Tahapan Implementasi (Migration Strategy)
- Proposed Changes
- @supabase/ssr
- sync_rename_basemen_to_mcn.cjs
- graphify reference: query, path, explain
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- next-crm/README.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- next
- Run and deploy your AI Studio app
- rules/graphify.md
- extraction-spec.md
- workflows/graphify.md
- AGENTS.md
- task.md
- task10010426.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 41 edges
2. `cn()` - 35 edges
3. `UserProfile` - 34 edges
4. `cn()` - 33 edges
5. `UserProfile` - 31 edges
6. `Lead` - 26 edges
7. `Lead` - 25 edges
8. `db` - 20 edges
9. `createClient()` - 18 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `users` --references--> `auth`  [EXTRACTED]
  supabase/migrations/00000000000000_initial_schema.sql → src/firebase.ts
- `AdminUsersProps` --references--> `UserProfile`  [EXTRACTED]
  next-crm/src/components/AdminUsersClient.tsx → next-crm/src/types.ts
- `PendingScreen()` --calls--> `createClient()`  [EXTRACTED]
  next-crm/src/components/PendingScreen.tsx → next-crm/src/utils/supabase/client.ts
- `NavItem()` --calls--> `cn()`  [EXTRACTED]
  next-crm/src/components/Sidebar.tsx → next-crm/src/lib/utils.ts
- `processImport()` --calls--> `createClient()`  [EXTRACTED]
  next-crm/src/app/actions/importActions.ts → next-crm/src/utils/supabase/server.ts

## Import Cycles
- None detected.

## Communities (139 total, 54 thin omitted)

### Community 0 - "src/types.ts"
Cohesion: 0.05
Nodes (97): react-router-dom, App(), SUPER_ADMIN_EMAILS, AdminApprovals(), AdminApprovalsProps, AdminTargets(), AdminTargetsProps, AdminUsers() (+89 more)

### Community 1 - "pg"
Cohesion: 0.04
Nodes (20): pg, { Client }, { Client }, fs, path, { Client }, { Client }, { Client } (+12 more)

### Community 2 - "00000000000002_recreate_schema_text.sql"
Cohesion: 0.10
Nodes (34): auth.users, edit_requests, funnel_history, global_audit_logs, global_targets, individual_targets, lead_notes, leads (+26 more)

### Community 3 - "LeadsClient.tsx"
Cohesion: 0.21
Nodes (10): AdminUsersClient(), AdminUsersProps, ConfirmModal(), ConfirmModalProps, ImportModalClient(), REP_NAMES, STAGES, LeadModalClient() (+2 more)

### Community 4 - "next-crm/package.json"
Cohesion: 0.07
Nodes (26): clsx, date-fns, lucide-react, motion, papaparse, react, react-dom, sonner (+18 more)

### Community 5 - "package.json"
Cohesion: 0.08
Nodes (25): clsx, date-fns, lucide-react, motion, papaparse, react, react-dom, sonner (+17 more)

### Community 6 - "OIForecastClient.tsx"
Cohesion: 0.19
Nodes (17): CurrencyInput(), CurrencyInputProps, formatIDDate(), formatMoney(), OIGrid(), OIGridProps, formatMoney(), MONTH_NAMES (+9 more)

### Community 7 - "next-crm/src/types.ts"
Cohesion: 0.17
Nodes (15): TaskModal(), TaskModalProps, TaskCardProps, TasksClient(), DEFAULT_PERMISSIONS, ForecastStatus, LEAD_SOURCES, LeadSource (+7 more)

### Community 8 - "createClient"
Cohesion: 0.19
Nodes (11): processImport(), NOTE: Ini adalah abstraksi dari logika 1400 baris lama., bulkDeleteLeads(), importLeadsBatch(), ApprovalsPage(), TargetsPage(), UsersPage(), GET() (+3 more)

### Community 9 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, clsx, date-fns, dotenv, express, firebase, @google/genai, lucide-react (+13 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, clsx, date-fns, lucide-react, motion, next, papaparse, react (+9 more)

### Community 12 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 13 - "cn"
Cohesion: 0.16
Nodes (14): RateCard(), StatCard(), LeadDetailClient(), MilestoneItem(), TabButton(), MarkdownEditor(), MarkdownEditorProps, MarkdownRenderer() (+6 more)

### Community 14 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+7 more)

### Community 15 - "backup_incremental.cjs"
Cohesion: 0.18
Nodes (13): BACKUP_DIR, crypto, db, fs, { getFirestore }, getSubCollectionsData(), hashData(), { initializeApp, cert } (+5 more)

### Community 16 - "fix_tasks_ts.cjs"
Cohesion: 0.15
Nodes (12): confirmModalContent, destConfirmModal, destTaskModal, destTasksClient, fs, pageContent, pagePath, path (+4 more)

### Community 17 - "createClient"
Cohesion: 0.20
Nodes (13): LoginPage(), AdminTargetsClient(), AdminTargetsProps, BulkStatusModal(), STAGES, DashboardClient(), DashboardProps, getStatusColor() (+5 more)

### Community 18 - "fix_all_ts.cjs"
Cohesion: 0.18
Nodes (10): bulk, bulkPath, fs, leadsClient, leadsClientPath, leadsPage, leadsPagePath, page (+2 more)

### Community 19 - "migrate_from_local.cjs"
Cohesion: 0.25
Nodes (10): BACKUP_DIR, { createClient }, crypto, fs, migrateLeadsParts(), migrateOIForecasts(), parseFirebaseDate(), path (+2 more)

### Community 20 - "next-crm/src/components/Sidebar.tsx"
Cohesion: 0.24
Nodes (7): metadata, RootLayout(), AppLayout(), PendingScreen(), NavItem(), Sidebar(), SidebarProps

### Community 21 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/papaparse, @types/react (+2 more)

### Community 22 - "UserProfile"
Cohesion: 0.19
Nodes (16): AdminApprovalsClient(), AdminApprovalsProps, BulkStatusModalProps, ImportModalProps, LeadDetailProps, LeadModalProps, LeadsTableProps, NotesModalProps (+8 more)

### Community 23 - "backup_firestore.cjs"
Cohesion: 0.22
Nodes (9): BACKUP_DIR, backupCollection(), db, fs, { getFirestore }, { initializeApp, cert }, path, runBackup() (+1 more)

### Community 24 - "fix_modals_logic.cjs"
Cohesion: 0.20
Nodes (9): fs, leadCode, leadPath, notesCode, notesPath, path, srcDir, statusCode (+1 more)

### Community 25 - "port_tasks.cjs"
Cohesion: 0.20
Nodes (9): destPage, destTaskModal, destTasksClient, fs, path, srcLegacyTaskModal, srcLegacyTasks, taskModalContent (+1 more)

### Community 26 - "PermissionSettingsClient.tsx"
Cohesion: 0.25
Nodes (6): CATEGORIES, DEFAULT_PERMISSIONS, PERMISSION_LABELS, PermissionSet, PermissionSettingsClient(), RolePermissions

### Community 27 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, firebase-admin, tailwindcss, tsx, @types/express, @types/node, typescript (+1 more)

### Community 28 - "fix_migration.cjs"
Cohesion: 0.25
Nodes (8): { createClient }, db, fix(), { getFirestore }, { initializeApp, cert }, parseDate(), serviceAccount, supabase

### Community 29 - "fix_tasks_ts_2.cjs"
Cohesion: 0.22
Nodes (8): fs, pageContent, pagePath, path, taskModalContent, taskModalPath, tasksClientPath, tasksContent

### Community 30 - "migrate.cjs"
Cohesion: 0.25
Nodes (8): { createClient }, db, { getFirestore }, { initializeApp, cert }, migrateData(), parseDate(), serviceAccount, supabase

### Community 31 - "migrate_remaining.cjs"
Cohesion: 0.25
Nodes (8): { createClient }, db, { getFirestore }, { initializeApp, cert }, parseDate(), run(), serviceAccount, supabase

### Community 32 - "patch_oi_forecasts.cjs"
Cohesion: 0.25
Nodes (8): { createClient }, db, { getFirestore }, { initializeApp, cert }, parseDate(), run(), serviceAccount, supabase

### Community 33 - "fix_modals_logic3.cjs"
Cohesion: 0.25
Nodes (7): fs, leadCode, leadPath, notesCode, notesPath, path, srcDir

### Community 34 - "import_missing.cjs"
Cohesion: 0.29
Nodes (7): { createClient }, fs, parseDateCorrectly(), path, run(), supabase, { v4: uuidv4 }

### Community 35 - "patch_dates.cjs"
Cohesion: 0.29
Nodes (7): BACKUP_DIR, { createClient }, fs, parseDateCorrectly(), patch(), path, supabase

### Community 36 - "sync_new_history_notes.cjs"
Cohesion: 0.29
Nodes (7): { createClient }, fs, parseDateCorrectly(), path, run(), supabase, { v4: uuidv4 }

### Community 37 - "fix_ts_final.cjs"
Cohesion: 0.29
Nodes (6): bulk, bulkPath, fs, leadsClient, leadsClientPath, path

### Community 38 - "port_admin_approvals.cjs"
Cohesion: 0.29
Nodes (6): content, destClient, destPage, fs, path, srcLegacy

### Community 39 - "port_admin_targets.cjs"
Cohesion: 0.29
Nodes (6): content, destClient, destPage, fs, path, srcLegacy

### Community 40 - "port_admin_users.cjs"
Cohesion: 0.29
Nodes (6): content, destClient, destPage, fs, path, srcLegacy

### Community 41 - "funnel_history"
Cohesion: 0.60
Nodes (5): funnel_history, leads, get_dashboard_stats(), get_ghosted_leads(), get_individual_contributions()

### Community 42 - "inspect_fb.cjs"
Cohesion: 0.33
Nodes (4): db, { getFirestore }, { initializeApp, cert }, serviceAccount

### Community 43 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

### Community 44 - "check_firebase_raw.cjs"
Cohesion: 0.33
Nodes (5): BACKUP_DIR, data, file, fs, path

### Community 45 - "check_firebase_stats.cjs"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateString(), path

### Community 46 - "check_logic_2.cjs"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDate(), path

### Community 47 - "check_logic_3.cjs"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateCorrectly(), path

### Community 48 - "check_logic_4.cjs"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateCorrectly(), path

### Community 49 - "check_logic_5.cjs"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateCorrectly(), path

### Community 50 - "compare_latest.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 51 - "find_missing.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 52 - "find_missing2.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 53 - "fix_modals_logic2.cjs"
Cohesion: 0.33
Nodes (5): fs, path, srcDir, statusCode, statusPath

### Community 54 - "port_import_modal.cjs"
Cohesion: 0.33
Nodes (5): content, destClient, fs, path, srcLegacy

### Community 55 - "port_lead_detail.cjs"
Cohesion: 0.33
Nodes (5): code, destFile, fs, path, srcFile

### Community 56 - "refactor_dashboard.cjs"
Cohesion: 0.33
Nodes (5): code, dashboardPath, fs, path, srcDir

### Community 57 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 58 - "src/middleware.ts"
Cohesion: 0.60
Nodes (3): config, middleware(), updateSession()

### Community 59 - "check_all_datechated.cjs"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 60 - "check_all_time.cjs"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 61 - "check_lead_funnel.cjs"
Cohesion: 0.40
Nodes (4): backupDir, files, fs, path

### Community 62 - "check_status_all.cjs"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 63 - "check_string.cjs"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 64 - "extract.cjs"
Cohesion: 0.40
Nodes (4): content, fs, lines, startIndex

### Community 65 - "extract2.cjs"
Cohesion: 0.40
Nodes (4): content, fs, lines, startIndex

### Community 66 - "fix_bulk_modal.cjs"
Cohesion: 0.40
Nodes (4): content, file, fs, path

### Community 67 - "fix_import_modal.cjs"
Cohesion: 0.40
Nodes (4): content, filePath, fs, path

### Community 68 - "force_fix_navigate.cjs"
Cohesion: 0.40
Nodes (4): content, file, fs, path

### Community 69 - "refactor_leads.cjs"
Cohesion: 0.40
Nodes (4): content, filePath, fs, path

### Community 71 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 99 - "refactor_firebase.cjs"
Cohesion: 0.50
Nodes (3): files, fs, path

### Community 114 - "Proposed Changes"
Cohesion: 0.08
Nodes (24): All Components — Permission Checks, Core App, Data Model — Firestore `settings/permissions`, Fitur 1: Dynamic Permission Management (Lord), Fitur 2: Legacy Master Database v2 Import, Format CSV (dari gambar), Implementasi, Implementasi (+16 more)

### Community 115 - "DOKUMENTASI SISTEM & ARSITEKTUR LENGKAP"
Cohesion: 0.09
Nodes (22): 1. Dual `node_modules` & Kode Legacy (Menyita ~850 MB), 1. RINGKASAN ARSITEKTUR PROYEK, 2. File Sampah & Backup Database di Repositori Git (Menyita ~15 MB), 2. SKEMA BASIS DATA & RELASI DATA (SUPABASE POSTGRESQL), 3. ALUR KERJA PENGGUNA (END-TO-END WORKFLOWS), 3. Optimasi Ukuran Bundle & Kecepatan Build Next.js, 4. KATALOG TOMBOL, MODAL, DAN SISTEM INPUT UI, 4. Kebersihan Kredensial & Keamanan (+14 more)

### Community 116 - "Enhancing CRM Analytics: Targets & Deal Revenue"
Cohesion: 0.13
Nodes (14): 1. Data Models (`src/types.ts`), 2. Modul Core (Status Update & Blueprint), 3. Analytics Dashboard (`src/components/Dashboard.tsx`), Enhancing CRM Analytics: Targets & Deal Revenue, Manual Verification, [MODIFY] `firebase-blueprint.json`, [MODIFY] `src/components/Dashboard.tsx`, [MODIFY] `src/components/LeadModal.tsx` (+6 more)

### Community 117 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 118 - "Tahapan Implementasi (Migration Strategy)"
Cohesion: 0.22
Nodes (8): Blueprint Migrasi: CoreDesk CRM TNT V2 -> Next.js & Supabase, Daftar Fitur yang Dijamin Tidak Akan Hilang (Feature Parity Guarantee), Fase 1: Desain Skema Database Relasional (Supabase), Fase 2: Setup Next.js & Server Actions, Fase 3: Migrasi Antarmuka (User Interface), Fase 4: Export-Import Data Asli (Cut-Over), Tahapan Implementasi (Migration Strategy), User Review Required

### Community 119 - "Proposed Changes"
Cohesion: 0.25
Nodes (7): 1. `src/components/ImportModal.tsx`, 2. `src/components/LeadModal.tsx` (Tambah Lead Manual), 3. `src/types.ts` & `firebase-blueprint.json`, Open Questions, Proposed Changes, Rencana Peningkatan Sistem Anti-Duplikat & Import Individu, User Review Required

### Community 120 - "@supabase/ssr"
Cohesion: 0.25
Nodes (4): getStatusColor(), LeadsClient(), OIForecastPage(), @supabase/ssr

### Community 121 - "sync_rename_basemen_to_mcn.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, envPath, fs, path, supabase

### Community 122 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 123 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 124 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 125 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 126 - "next-crm/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **620 isolated node(s):** `{ initializeApp, cert }`, `{ getFirestore }`, `serviceAccount`, `db`, `eslintConfig` (+615 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 724 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `src/types.ts` to `package.json`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `@supabase/ssr` connect `@supabase/ssr` to `LeadsClient.tsx`, `next-crm/package.json`, `createClient`, `createClient`, `next-crm/src/components/Sidebar.tsx`, `src/middleware.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `LeadsClient.tsx`, `OIForecastClient.tsx`, `next-crm/src/types.ts`, `cn`, `next-crm/src/components/Sidebar.tsx`, `UserProfile`, `@supabase/ssr`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `{ initializeApp, cert }`, `{ getFirestore }`, `serviceAccount` to the rest of the system?**
  _620 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `src/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05092426952892069 - nodes in this community are weakly interconnected._
- **Should `pg` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `00000000000002_recreate_schema_text.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._