# Graph Report - crm-sales-tnt-v2  (2026-09-16)

## Corpus Check
- Large corpus: 300 files · ~1,072,306 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1028 nodes · 1614 edges · 114 communities (72 shown, 42 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Legacy React-Vite & Firebase CRM
- Hotfix & Patch Scripts
- Next.js CRM Core UI & Workflows
- Next.js CRM Core UI & Workflows
- Supabase Schema & DB Migrations
- Legacy React-Vite & Firebase CRM
- Next.js CRM Core UI & Workflows
- Module: Components Taskmodal
- Legacy React-Vite & Firebase CRM
- Legacy React-Vite & Firebase CRM
- Config & Dependencies (next)
- Supabase Schema & DB Migrations
- Next.js CRM Core UI & Workflows
- Next.js CRM Core UI & Workflows
- Config & Dependencies (tsconfig)
- Legacy React-Vite & Firebase CRM
- Hotfix & Patch Scripts
- Next.js CRM Core UI & Workflows
- Next.js CRM Core UI & Workflows
- Legacy React-Vite & Firebase CRM
- Legacy React-Vite & Firebase CRM
- Module: Package Devdependencies
- Next.js CRM Core UI & Workflows
- Legacy React-Vite & Firebase CRM
- Hotfix & Patch Scripts
- Hotfix & Patch Scripts
- Legacy React-Vite & Firebase CRM
- Legacy React-Vite & Firebase CRM
- Legacy React-Vite & Firebase CRM
- Hotfix & Patch Scripts
- Legacy React-Vite & Firebase CRM
- Legacy React-Vite & Firebase CRM
- Next.js CRM Core UI & Workflows
- Hotfix & Patch Scripts
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Next.js CRM Core UI & Workflows
- Hotfix & Patch Scripts
- Hotfix & Patch Scripts
- Hotfix & Patch Scripts
- Supabase Schema & DB Migrations
- Legacy React-Vite & Firebase CRM
- Module: Package Scripts
- Legacy React-Vite & Firebase CRM
- Legacy React-Vite & Firebase CRM
- Module: Check Logic 2
- Module: Check Logic 3
- Module: Check Logic 4
- Module: Check Logic 5
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Hotfix & Patch Scripts
- Hotfix & Patch Scripts
- Hotfix & Patch Scripts
- Module: Refactor Dashboard
- Module: Package Scripts
- Supabase Schema & DB Migrations
- Module: Check All Datechated
- Module: Check All Time
- Module: Check Lead Funnel
- Module: Check Status All
- Module: Check String
- Module: Extract
- Module: Extract2
- Hotfix & Patch Scripts
- Hotfix & Patch Scripts
- Module: Force Fix Navigate
- Module: Refactor Leads
- Supabase Schema & DB Migrations
- Module: Ref Tailwindcss Vite
- Module: Scratch Analyze
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Legacy React-Vite & Firebase CRM
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Supabase Schema & DB Migrations
- Legacy React-Vite & Firebase CRM
- Supabase Schema & DB Migrations
- Module: Eslint Config
- Module: Postcss Config
- Module: Public Users

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
- `ImportModalProps` --references--> `UserProfile`  [EXTRACTED]
  next-crm/src/components/ImportModalClient.tsx → next-crm/src/types.ts
- `PendingScreen()` --calls--> `createClient()`  [EXTRACTED]
  next-crm/src/components/PendingScreen.tsx → next-crm/src/utils/supabase/client.ts
- `TasksProps` --references--> `UserProfile`  [EXTRACTED]
  next-crm/src/components/TasksClient.tsx → next-crm/src/types.ts

## Import Cycles
- None detected.

## Communities (114 total, 42 thin omitted)

### Community 0 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.05
Nodes (97): react-router-dom, App(), SUPER_ADMIN_EMAILS, AdminApprovals(), AdminApprovalsProps, AdminTargets(), AdminTargetsProps, AdminUsers() (+89 more)

### Community 1 - "Hotfix & Patch Scripts"
Cohesion: 0.04
Nodes (20): pg, { Client }, { Client }, fs, path, { Client }, { Client }, { Client } (+12 more)

### Community 2 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.10
Nodes (34): auth.users, edit_requests, funnel_history, global_audit_logs, global_targets, individual_targets, lead_notes, leads (+26 more)

### Community 3 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.14
Nodes (18): LoginPage(), AdminUsersClient(), AdminUsersProps, BulkStatusModal(), ConfirmModal(), ConfirmModalProps, ImportModalClient(), ImportModalProps (+10 more)

### Community 4 - "Supabase Schema & DB Migrations"
Cohesion: 0.07
Nodes (26): clsx, date-fns, lucide-react, motion, papaparse, react, react-dom, sonner (+18 more)

### Community 5 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.08
Nodes (25): clsx, date-fns, lucide-react, motion, papaparse, react, react-dom, sonner (+17 more)

### Community 6 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.19
Nodes (16): formatIDDate(), formatMoney(), OIGrid(), OIGridProps, formatMoney(), MONTH_NAMES, OIMilestone(), OIMilestoneProps (+8 more)

### Community 7 - "Module: Components Taskmodal"
Cohesion: 0.13
Nodes (19): TaskModal(), TaskModalProps, TaskCard(), TaskCardProps, TasksClient(), TasksProps, DEFAULT_PERMISSIONS, ForecastStatus (+11 more)

### Community 8 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.18
Nodes (12): processImport(), NOTE: Ini adalah abstraksi dari logika 1400 baris lama., bulkDeleteLeads(), importLeadsBatch(), ApprovalsPage(), TargetsPage(), UsersPage(), GET() (+4 more)

### Community 9 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.10
Nodes (21): dependencies, clsx, date-fns, dotenv, express, firebase, @google/genai, lucide-react (+13 more)

### Community 10 - "Config & Dependencies (next)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "Supabase Schema & DB Migrations"
Cohesion: 0.12
Nodes (17): dependencies, clsx, date-fns, lucide-react, motion, next, papaparse, react (+9 more)

### Community 12 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.18
Nodes (10): BulkStatusModalProps, STAGES, CurrencyInput(), CurrencyInputProps, MarkdownEditor(), MarkdownEditorProps, STAGES, StatusModalClient() (+2 more)

### Community 13 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.19
Nodes (12): AdminTargetsClient(), RateCard(), StatCard(), LeadDetailClient(), MilestoneItem(), TabButton(), MarkdownRenderer(), STAGES (+4 more)

### Community 14 - "Config & Dependencies (tsconfig)"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+7 more)

### Community 15 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.18
Nodes (13): BACKUP_DIR, crypto, db, fs, { getFirestore }, getSubCollectionsData(), hashData(), { initializeApp, cert } (+5 more)

### Community 16 - "Hotfix & Patch Scripts"
Cohesion: 0.15
Nodes (12): confirmModalContent, destConfirmModal, destTaskModal, destTasksClient, fs, pageContent, pagePath, path (+4 more)

### Community 17 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.33
Nodes (7): AdminTargetsProps, DashboardClient(), DashboardProps, getStatusColor(), AuditLog, GlobalTarget, IndividualTarget

### Community 18 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.18
Nodes (10): bulk, bulkPath, fs, leadsClient, leadsClientPath, leadsPage, leadsPagePath, page (+2 more)

### Community 19 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.25
Nodes (10): BACKUP_DIR, { createClient }, crypto, fs, migrateLeadsParts(), migrateOIForecasts(), parseFirebaseDate(), path (+2 more)

### Community 20 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.24
Nodes (6): nextConfig, metadata, RootLayout(), AppLayout(), PendingScreen(), next

### Community 21 - "Module: Package Devdependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/papaparse, @types/react (+2 more)

### Community 22 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.38
Nodes (9): AdminApprovalsProps, LeadDetailProps, LeadModalProps, LeadsTableProps, NotesModalProps, StatusModalProps, EditRequest, Lead (+1 more)

### Community 23 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.22
Nodes (9): BACKUP_DIR, backupCollection(), db, fs, { getFirestore }, { initializeApp, cert }, path, runBackup() (+1 more)

### Community 24 - "Hotfix & Patch Scripts"
Cohesion: 0.20
Nodes (9): fs, leadCode, leadPath, notesCode, notesPath, path, srcDir, statusCode (+1 more)

### Community 25 - "Hotfix & Patch Scripts"
Cohesion: 0.20
Nodes (9): destPage, destTaskModal, destTasksClient, fs, path, srcLegacyTaskModal, srcLegacyTasks, taskModalContent (+1 more)

### Community 26 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.25
Nodes (6): CATEGORIES, DEFAULT_PERMISSIONS, PERMISSION_LABELS, PermissionSet, PermissionSettingsClient(), RolePermissions

### Community 27 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, firebase-admin, tailwindcss, tsx, @types/express, @types/node, typescript (+1 more)

### Community 28 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.25
Nodes (8): { createClient }, db, fix(), { getFirestore }, { initializeApp, cert }, parseDate(), serviceAccount, supabase

### Community 29 - "Hotfix & Patch Scripts"
Cohesion: 0.22
Nodes (8): fs, pageContent, pagePath, path, taskModalContent, taskModalPath, tasksClientPath, tasksContent

### Community 30 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.25
Nodes (8): { createClient }, db, { getFirestore }, { initializeApp, cert }, migrateData(), parseDate(), serviceAccount, supabase

### Community 31 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.25
Nodes (8): { createClient }, db, { getFirestore }, { initializeApp, cert }, parseDate(), run(), serviceAccount, supabase

### Community 32 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.25
Nodes (8): { createClient }, db, { getFirestore }, { initializeApp, cert }, parseDate(), run(), serviceAccount, supabase

### Community 33 - "Hotfix & Patch Scripts"
Cohesion: 0.25
Nodes (7): fs, leadCode, leadPath, notesCode, notesPath, path, srcDir

### Community 34 - "Supabase Schema & DB Migrations"
Cohesion: 0.29
Nodes (7): { createClient }, fs, parseDateCorrectly(), path, run(), supabase, { v4: uuidv4 }

### Community 35 - "Supabase Schema & DB Migrations"
Cohesion: 0.29
Nodes (7): BACKUP_DIR, { createClient }, fs, parseDateCorrectly(), patch(), path, supabase

### Community 36 - "Supabase Schema & DB Migrations"
Cohesion: 0.29
Nodes (7): { createClient }, fs, parseDateCorrectly(), path, run(), supabase, { v4: uuidv4 }

### Community 37 - "Next.js CRM Core UI & Workflows"
Cohesion: 0.29
Nodes (6): bulk, bulkPath, fs, leadsClient, leadsClientPath, path

### Community 38 - "Hotfix & Patch Scripts"
Cohesion: 0.29
Nodes (6): content, destClient, destPage, fs, path, srcLegacy

### Community 39 - "Hotfix & Patch Scripts"
Cohesion: 0.29
Nodes (6): content, destClient, destPage, fs, path, srcLegacy

### Community 40 - "Hotfix & Patch Scripts"
Cohesion: 0.29
Nodes (6): content, destClient, destPage, fs, path, srcLegacy

### Community 41 - "Supabase Schema & DB Migrations"
Cohesion: 0.60
Nodes (5): funnel_history, leads, get_dashboard_stats(), get_ghosted_leads(), get_individual_contributions()

### Community 42 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.33
Nodes (4): db, { getFirestore }, { initializeApp, cert }, serviceAccount

### Community 43 - "Module: Package Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, clean, dev, lint, preview

### Community 44 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.33
Nodes (5): BACKUP_DIR, data, file, fs, path

### Community 45 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateString(), path

### Community 46 - "Module: Check Logic 2"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDate(), path

### Community 47 - "Module: Check Logic 3"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateCorrectly(), path

### Community 48 - "Module: Check Logic 4"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateCorrectly(), path

### Community 49 - "Module: Check Logic 5"
Cohesion: 0.40
Nodes (5): BACKUP_DIR, check(), fs, parseDateCorrectly(), path

### Community 50 - "Supabase Schema & DB Migrations"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 51 - "Supabase Schema & DB Migrations"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 52 - "Supabase Schema & DB Migrations"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, supabase

### Community 53 - "Hotfix & Patch Scripts"
Cohesion: 0.33
Nodes (5): fs, path, srcDir, statusCode, statusPath

### Community 54 - "Hotfix & Patch Scripts"
Cohesion: 0.33
Nodes (5): content, destClient, fs, path, srcLegacy

### Community 55 - "Hotfix & Patch Scripts"
Cohesion: 0.33
Nodes (5): code, destFile, fs, path, srcFile

### Community 56 - "Module: Refactor Dashboard"
Cohesion: 0.33
Nodes (5): code, dashboardPath, fs, path, srcDir

### Community 57 - "Module: Package Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 58 - "Supabase Schema & DB Migrations"
Cohesion: 0.60
Nodes (3): config, middleware(), updateSession()

### Community 59 - "Module: Check All Datechated"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 60 - "Module: Check All Time"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 61 - "Module: Check Lead Funnel"
Cohesion: 0.40
Nodes (4): backupDir, files, fs, path

### Community 62 - "Module: Check Status All"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 63 - "Module: Check String"
Cohesion: 0.40
Nodes (3): BACKUP_DIR, fs, path

### Community 64 - "Module: Extract"
Cohesion: 0.40
Nodes (4): content, fs, lines, startIndex

### Community 65 - "Module: Extract2"
Cohesion: 0.40
Nodes (4): content, fs, lines, startIndex

### Community 66 - "Hotfix & Patch Scripts"
Cohesion: 0.40
Nodes (4): content, file, fs, path

### Community 67 - "Hotfix & Patch Scripts"
Cohesion: 0.40
Nodes (4): content, filePath, fs, path

### Community 68 - "Module: Force Fix Navigate"
Cohesion: 0.40
Nodes (4): content, file, fs, path

### Community 69 - "Module: Refactor Leads"
Cohesion: 0.40
Nodes (4): content, filePath, fs, path

### Community 71 - "Module: Ref Tailwindcss Vite"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 99 - "Legacy React-Vite & Firebase CRM"
Cohesion: 0.50
Nodes (3): files, fs, path

## Knowledge Gaps
- **516 isolated node(s):** `{ initializeApp, cert }`, `{ getFirestore }`, `serviceAccount`, `db`, `eslintConfig` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 597 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router-dom` connect `Legacy React-Vite & Firebase CRM` to `Legacy React-Vite & Firebase CRM`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `@supabase/ssr` connect `Next.js CRM Core UI & Workflows` to `Supabase Schema & DB Migrations`, `Next.js CRM Core UI & Workflows`, `Legacy React-Vite & Firebase CRM`, `Next.js CRM Core UI & Workflows`, `Legacy React-Vite & Firebase CRM`, `Supabase Schema & DB Migrations`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `pg` connect `Hotfix & Patch Scripts` to `Legacy React-Vite & Firebase CRM`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `{ initializeApp, cert }`, `{ getFirestore }`, `serviceAccount` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Legacy React-Vite & Firebase CRM` be split into smaller, more focused modules?**
  _Cohesion score 0.05092426952892069 - nodes in this community are weakly interconnected._
- **Should `Hotfix & Patch Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `Next.js CRM Core UI & Workflows` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._