# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 26 · **Date:** 2026-11-07 · **Snapshot author:** Z.ai Code agent
> **v26 changelog:** **ROADMAP PHASE 4 COMPLETE (step 26)** — S6 bulk operations ✅ + QE-tagging typeahead ✅ + P3 real file upload ✅, all DoD-verified live (demo mode, fa/en, 1280/390); **G2 AI auto-organize ⏸ NOT implemented** (owner gate: the roadmap itself requires a separate product decision — honest ⏸ note left in the roadmap). P3 cloud path honest-unverified (no storage emulator in `firebase.json`; real project frozen) → Cloud-Go-Live backlog. Zero schema change (fields already existed), zero new runtime dependencies, Firestore rules untouched. Evidence: `roadmaps/evidence/p4-*.png` (11 files committed). Honest notes: the step brief said "8 evidence pngs" — 11 exist on disk and all are committed; the sandbox recycle had wiped the demo SQLite DB mid-session (re-seeded canonically, 23/8/16).
> **v25 changelog (historical):** ECC workflow layer installed (agent tooling, step 25) — 11 curated `skills/ecc-*` skills + `AGENTS.md` lifecycle + `docs/ECC-INSTALL.md` install record via the ECC Manual Adaptation path (security sweep PASS; provenance commit `d2ef268`). `/skills/` is gitignored → ECC folders were force-added to git.
> **Versioning note (honesty):** the step-25 task brief said "bump to v9", but the live file was already at **v24** (v9 was consumed by Phase 1 history long ago). The monotonic protocol bump landed at **v25**; no version numbers were regressed.
> **v24 status (historical, still true):** ROADMAP PHASE 3 COMPLETE — G1 ✅ + S5 ✅ + S2 ✅, all DoD-verified (demo + live Firebase Emulator, fa/en, 1280/390).
> **v23 provenance note (honesty):** the S5 code + cloud evidence had already been committed inside `806d717` (bundled with G1; its message mentions only G1). Step 23 added the fresh demo-mode DoD verification, evidence review and documentation — recorded so the ledger matches reality.
> **v8 note:** full rewrite — the pre-v8 snapshot predated the entire application build and was severely outdated.

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Feature upgrade plan | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. Produced per owner's 11-section analyst mandate (12 live screenshots in `roadmaps/evidence/01…12` + full code re-read). Phases 1–5 with checkboxes, DoD per item, priority scoring, Keep/Change/Remove. |
| **Current gate** | **Roadmap Phase 4 — «گسترش ارزش»: COMPLETE (owner order, step 26).** S6 ✅ · QE-tagging ✅ · P3 ✅ — all DoD-verified live; **G2 ⏸ deliberately NOT implemented** (roadmap requires a separate owner product decision). **Phase 5 (P1 Telegram bridge) still FROZEN awaiting the owner's explicit order.** After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md` install record. Manual Adaptation path (no native ECC target in this harness). Skills applied in step 26: `ecc-change-impact`, `ecc-react-patterns`/`ecc-typescript-patterns`, `ecc-security-review` (upload threat model), `ecc-verification-loop`. See §2 "ECC workflow layer". |
| Development status | **Full application implemented and running** (see §2). **Phases 1–4 COMPLETE** (Phases 1–2 + G1/S5/S2 of Phase 3 verified on both modes; Phase 4 verified on demo mode — cloud-mode specifics honest-scoped, see §8/§12). |
| Next allowed step | **Await owner's order for Phase 5 (P1 Telegram bridge — FROZEN until explicit owner order) and/or the separate G2 product decision.** KPI فاز ۴: bulk operations in ONE batch (verified: 10 items → `updated:10`) + tagging quality (typeahead from real usage) + real file capture. Evidence: `roadmaps/evidence/p4-*.png` (11), plus G1/S5/S2/P1/P2 sets. |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up, honest "continue in demo mode" entry, emulator badge, not-configured fallback (this deployment has no real Firebase env → cloud sign-in works against the LOCAL Emulator Suite; production values absent).
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, 4 stat cards, category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: search (300 ms debounce), filter toolbar (QE2), type/favorite/archived/category/tags filters, QE5 active-filters bar, **S1 (v18): paginated results — 30/page + «نمایش بیشتر / Load more ({n} remaining)»**; **S3 (v20): filters in the URL hash** `#/library?q=…&type=…&cat=…&tags=…&fav=1&arch=1&sort=…` (deep-link/refresh/back-forward verified); layout stays device-local; **S6 (v26): selection mode** (below).
  - **Categories**: category CRUD dialog + tags tab (create/filter/delete); QE3 clickable category cards (keyboard-accessible, ⋯ isolated).
  - **Settings**: profile, theme, language, JSON export, demo-data reset (demo-only), environment/about.
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types, title/content/url/mediaUrl, category, shared tag chips; **QE6 (v14): error-prevention save flow** (causal disabled-state hint); **S2 (v24): paste-link detection + shared tag chips**; **P3 (v26): real file upload for file/image type** (upload zone mirroring the allowlist, preview card with thumbnail/name/size/remove, empty title auto-fills from the file name with a hint, causal errors too-large/unsupported/required, save disabled while uploading; image keeps the media-URL alternative until a file is uploaded; video/text flows unchanged).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing, **S4 (v19): title/content editing**; tag add/remove via the shared S2 chips component (now with the v26 typeahead); favorite/archive/delete (confirm), open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, category chip; QE1 list rows (snippet + relative date, `ms-auto`); QE4 shared `TagChips` (max 2 + Persian `+N`); **S6 (v26): per-card `SelectToggle` checkbox in BOTH layouts** (replaces the star while selecting; click/keyboard propagation isolated from card open).
- **S6 BULK OPERATIONS (v26, demo DoD verified live):**
  - **Backend:** `POST /api/notes/bulk` (`src/app/api/notes/bulk/route.ts`) + `bulkNoteSchema` (`src/server/schemas.ts`, zod, ≤500 ids = Firestore writeBatch ceiling) + `bulkUpdateNotes` (`src/server/services/notes.ts`) — demo = ONE Prisma `updateMany` per action; state guards (categorize/archive/unarchive/delete only touch live notes; restore only trashed; categorize-to-missing-category → 400).
  - **Cloud:** `repository.bulkUpdateNotes` — ONE committed `writeBatch` per ≤500 chunk (S8 helpers), denormalized `category` ref kept in lockstep; `firestore.rules` needed NO change (all fields already whitelisted).
  - **UI:** selection mode via store flag `bulkSelectMode` (`src/stores/app-store.ts`; auto-off on leaving library) + `ListChecks` toolbar toggle at the stable end of the bar + per-card checkboxes (both layouts) + fixed action bar (mobile: above bottom nav at `bottom-[74px]`; desktop: centered bottom; **the capture FAB hides while selecting** — mutually exclusive flows). Contextual actions: categorize (incl. «بدون دسته»), archive/unarchive, soft-delete with a 7-second batch-undo toast, restore-only in the trash view. `undo-metrics.recordDeletion/recordUndo` now take a count (bulk actions count every note).
  - DoD verified live: 10 selected → ONE batch → `updated:10`, category «آموزش» counter 2→12, toast «۱۰ مورد دسته‌بندی شد»; trash bulk-restore «۲ مورد بازگردانی شد»; EN/LTR pass; mobile 390 — bar fits above nav, FAB hidden during selection and back after exit. Evidence: `p4-s6-*.png`.
- **QE-TAGGING TYPEAHEAD (v26, cache-only, no AI):** `src/components/app/tag-chips-input.tsx` datalist → filtered dropdown: startsWith-first then contains, tiebreak by `noteCount` from the `useTags` cache; ≤6 suggestions; selected tags excluded; ↑/↓+Enter keyboard nav; first Escape closes the menu, second commits+blurs (S2 contract intact); mouse pick keeps focus (commit-on-blur never fires); full ARIA combobox/listbox/activedescendant. Both capture paths upgrade at once (shared S2 component). Evidence: `p4-qe-typeahead-fa.png` (typing «آم» → «آموزش انگلیسی» + usage count).
- **P3 REAL FILE UPLOAD (v26; demo verified live, cloud path honest-unverified):**
  - **Demo backend:** `src/server/storage.ts` (10 MB cap, extension allowlist jpg/jpeg/png/webp/gif/pdf/txt/md/csv, UUID-keyed storage under gitignored `db/uploads/`, regex-validated keys) + `POST /api/upload` (multipart) + `GET /api/files/[key]` (ext-derived content type, `X-Content-Type-Options: nosniff`, immutable cache). Client name NEVER reaches the filesystem. Security probes: traversal→400, `.exe`→415, extension-less→415; serving probe `200 image/png`.
  - **Cloud:** `repository.uploadFile` → Firebase Storage `users/{uid}/files/<uuid>-<safe-name>` + `getFirebaseStorage` (`src/services/firebase.ts`; storage-emulator connect is best-effort). **HONEST: unverified** — `firebase.json` has no storage emulator and the real project is frozen → owner-side bucket + storage rules required (Cloud-Go-Live backlog, §12).
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API over Prisma/SQLite (sample data, honestly labeled).
- **G1 REALTIME + OFFLINE (v22, Cloud mode):**
  - **`src/services/firebase.ts`** initializes Firestore with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` — IndexedDB persistence + multi-tab coordination. Fallbacks: SSR → `getFirestore`; HMR re-init → existing instance; IndexedDB blocked → `memoryLocalCache`. DEV-ONLY debug hook `window.__savedboxFirestore.{goOffline,goOnline}` (emulator builds only). **v26 addition: `getFirebaseStorage` (Firebase Storage, best-effort emulator connect for P3).**
  - **`src/services/realtime.ts`** — `realtimeStore`: THREE permanent uncapped `onSnapshot` listeners per UID (notes/categories/tags) replacing EVERY one-shot read; exposes live arrays + `ensureReady()` + `subscribe`/version + `getNoteById` + `mapNote`; includes the S5 7-day trash purge (batched, once per session).
  - **`src/services/repository.ts`** — reads derive from the live store (listNotes = 30-page presentation; stats/categories/tags = joins; loadCategoryRef/resolveTagRefs live-first). Fan-outs target the live array → read-free and UNCAPPED. **v26 addition: `bulkUpdateNotes` (chunked committed writeBatch) + `uploadFile` (Storage).**
  - **`src/components/app/app-shell.tsx`** — realtime bridge: start on sign-in, coalesced (50 ms) `queryClient.invalidateQueries()`, full teardown on unmount/UID change/sign-out. Single component-level listener → no unmount leak.
  - **`src/hooks/queries.ts`** — demo mode polls every 2 s (notes/stats/categories/tags, active tab only); cloud never polls.
  - **DoD verified live (2026-11-05):** second-device REST write appears without refresh; tab2-UI-write → tab1 without refresh; browser-offline write survives reload and syncs on reconnect; SDK-offline: cache browsing + latency-compensation + sync after `goOnline()`. Evidence: `roadmaps/evidence/g1-*.png` (5 files).
- **S2 CAPTURE UNIFICATION (v24, demo DoD verified live):**
  - **`src/components/app/tag-chips-input.tsx` (the shared component):** ONE tag-entry UX for quick capture AND the note detail sheet — chips (Badge + per-chip remove `aria-label`), commits on Enter/`,`/`،` (paste "a,b" → two chips), Backspace-on-empty removes the last chip, **commit-on-blur never loses a draft tag on Save**, exact-match dedup; Input-look container (focus ring), RTL-safe. **v26: `datalist` suggestions replaced by the filtered typeahead above (suggestions now carry `noteCount` — both call sites updated).**
  - **Paste-link detection:** pasting a bare URL into quick-capture's title → intercepted → form auto-converts to type=link + URL filled + hint «لینک شناسایی شد…»; QE6 precedence preserved.
  - **Detail sheet:** tag mutation = one list-based `patchNote({tagNames})` (both backends auto-create missing tags) — no stale-closure race.
- **S5 UNDO DELETE (v23, demo DoD verified live):**
  - **Soft delete end-to-end:** `deleteNote` sets `deletedAt`; restore clears it. Demo: `server/services/notes.ts` + `POST /api/notes/[id]/restore`; cloud: repository `updateDoc({deletedAt})`. 7-day auto-purge both modes. **v26: `undo-metrics` count params (bulk deletions/undos count every note).**
  - **Trash UX:** delete-confirm honestly says «به سطل منتقل می‌شود و تا ۷ روز قابل بازیابی است»; toast «به سطل منتقل شد» with **«بازگردانی» (7 s window)**; trash view + «سطل» chip (mutually exclusive with archived; deep-link `trash=1`); **v26: trash view selection mode is restore-only.**
  - **Undo-rate KPI:** `src/lib/undo-metrics.ts` shown in Settings → About.
- **S7→S8→S1→S4→S3 (Phase 2, v16–v20) remain in force**, with G1-era updates: (a) the S7 TTL snapshot and S1 cloud structured path were REPLACED by the G1 live store (read accounting = exactly 1 uncapped listener per session); (b) fan-outs no longer have the 500-note lookup cap.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (owner-only, field validation incl. optional `deletedAt`, catch-all deny), `firestore.indexes.json`, `scripts/rules-test.ts` (**39/39 pass** — rules UNCHANGED since, incl. step 26), `scripts/e2e-verify.sh` (15/15 at Firebase-phase time).
- **i18n/RTL**: type-safe flat dictionaries fa+en (`src/lib/i18n/dictionaries.ts` — fa default; **v26: S6/QE/P3 strings added in both**), `dir` synced, Persian digits, Vazirmatn.
- **Platform compliance**: single user-visible route `/`; API routes under `src/app/api/**`; sticky-footer rules; shadcn/ui New York only.
- **ECC workflow layer (agent tooling — step 25, commit `9361459`):**
  - **What:** 11 curated skills from [ECC](https://github.com/affaan-m/ecc) ("the agent harness operating system", MIT, 71 agents/314 skills) installed under **`skills/ecc-*`**: `ecc-tdd-workflow`, `ecc-verification-loop`, `ecc-security-review` (+ reference `cloud-infrastructure-security.md`), `ecc-change-impact`, `ecc-typescript-patterns`, `ecc-react-patterns`, `ecc-react-performance`, `ecc-nextjs-turbopack`, `ecc-prisma-patterns`, `ecc-i18n-sync`, `ecc-frontend-a11y`.
  - **Provenance:** source commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b` (2026-11-06, merge PR #3650); install record = **`docs/ECC-INSTALL.md`**; only the frontmatter `name:` was adapted — bodies byte-identical (verified `diff -r` at install).
  - **Workflow layer:** **`AGENTS.md`** (project root) = ECC core lifecycle `plan → test → implement → review → verify → remember → improve`, skill-activation table, command-intent registry, upgrade procedure.
  - **Honest capability boundaries** (full table in `docs/ECC-INSTALL.md`): skills ✅ (11 of 314) · agents ❌ · commands ❌ (intent registry in `AGENTS.md`) · hooks ❌ · rules packs ❌ · memory ❌ (here = SNAPSHOT + worklog protocol) · AgentShield ❌ (manual sweep PASS at install).
  - **Activation:** skills activate through the harness **Skill tool**; no runtime enforcement — advisory process, not code.
  - **Repo-persistence note:** `/skills/` gitignored by platform scaffold (`.gitignore` line 54) → the 11 `skills/ecc-*` folders force-added (`git add -f`) and committed. The other 19 harness-provided skills remain untracked by platform policy.
  - **Security:** pre-install sweep PASS. Temporary clone `.ecc-source/` deleted after checksums.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route: `/`. API routes (`src/app/api/**`), not server actions.
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties mandatory; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore` (repository starts it idempotently and awaits `ensureReady()`); UI pagination is presentation over the full local set; demo list remains server-paginated (30/page) with 2 s polling.**
- **S6 bulk contract (v26):** `POST /api/notes/bulk` — body `{ids: string[1..500], action: "categorize"|"archive"|"unarchive"|"delete"|"restore", categoryId?: string|null}` (`categoryId` required for `categorize`; `null` = uncategorize) → `{ok: true, updated: number}`; invalid → 400 (zod or `category-not-found`); 500 = internal. Cloud equivalent = `repository.bulkUpdateNotes` (one committed writeBatch per ≤500 chunk). Types: `BulkNotesInput`/`BulkNotesResponse` in `src/lib/domain/types.ts`.
- **P3 upload contract (v26):** `POST /api/upload` — multipart, server cap **10 MB** (`MAX_UPLOAD_BYTES`), extension allowlist jpg/jpeg/png/webp/gif/pdf/txt/md/csv (`FILE_CONTENT_TYPES` in `src/server/storage.ts`); rejects 415 (unsupported), 413-class (too large), 400 (no file/missing type). Success → `{url, fileName, fileSize}` (`UploadedFileInfo` in `src/lib/domain/types.ts`); stored key = server UUID + allowlisted ext under gitignored `db/uploads/` (demo). `GET /api/files/[key]` — key regex-validated (`isValidFileKey`, UUID-ext only → no traversal), content type derived from stored extension (never the client header), `nosniff`, immutable cache. Cloud: `repository.uploadFile` → Firebase Storage `users/{uid}/files/…`.
- **Firebase Emulator Suite (running in-sandbox for cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). `.env` has emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true`. **No storage emulator configured (step 26 fact) — the P3 cloud path therefore has no local verification target.** Bulk data via Firestore REST `:commit` with `Authorization: Bearer owner`; nullable strings MUST be `{"nullValue": null}`. Probe UID (G1 session): `94ZKYTmgH7xJibbkfR0RUY7vPDDT` (`tool-results/g1-probe-uid.txt`, untracked).
- **State:** Zustand (view/detailNoteId/captureOpen/filters/**bulkSelectMode (S6)**) + TanStack Query (UID-scoped keys; invalidations from mutations AND the realtime bridge).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa` (`src/lib/i18n/dictionaries.ts`); `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e scripts are verification scripts run on demand.
- **Agent tooling contract (ECC):** ECC skills are markdown guidance activated via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` is the advisory workflow layer. No hook runtime, no slash commands. Upgrade procedure = fresh ECC clone at a recorded commit + security sweep + re-record checksums (`AGENTS.md` / `docs/ECC-INSTALL.md`).
- **Phase-3 note:** G1 intentionally supersedes S1's cloud structured-query path (documented in repository.ts header).
- **Phase-4 note:** S6/P3 kept the G1 architecture — bulk writes go through the repository (live-store-aware), uploads go through a dedicated server module (`storage.ts`) + routes; no view owns listeners; no new state library.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding, re-issued with Phase 2/3 orders):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست» — snapshot, docs, commit AND push must each be evidenced.
- **D-note (step 26, honest):** uploaded files live OUTSIDE the repo (`db/uploads/` is gitignored by design) — they are **runtime data, not repo content**: a fresh clone has an empty uploads dir and previously uploaded attachments are recoverable **only by re-uploading**. This is recorded in §8, §10 and §12. (The roadmap itself gates G2 on a separate owner product decision — honored, not implemented.)

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO` (…, isFavorite, isArchived, deletedAt, savedAt, updatedAt), `CategoryDTO`, `TagDTO` (with `noteCount` — feeds the v26 typeahead ranking), `StatsDTO`, `ProfileDTO`, `NoteFilters` (+ `trash?: boolean`, pageToken/pageSize), `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`; **v26 additions: `BulkNotesInput`, `BulkNotesResponse`, `UploadedFileInfo`** (all three used by the S6/P3 contracts in §3).
- **Step-26 schema honesty: NO schema change.** The P3 upload reuses the long-existing `NoteDTO.mediaUrl/fileName/fileSize` fields (demo `db/custom.db` and Firestore NoteDoc both already carried them); S6 operates on existing boolean/category fields. No Prisma migration, no Firestore rules change.
- **Demo mode:** Prisma/SQLite (`prisma/schema.prisma` — Note/`deletedAt DateTime?` + `@@index([deletedAt])`/Category/Tag/NoteTag/Profile), sample data seeded (23 notes / 8 categories / 16 tags canonical — re-seeded via `POST /api/seed` at step 26 close-out; see §12 honest note (c)).
- **Cloud mode:** Firestore docs per `src/domain/types.ts` (NoteDoc/CategoryDoc/TagDoc/ProfileDoc) under `users/{uid}/…`; rules whitelist `deletedAt`; uploaded files → Firebase Storage `users/{uid}/files/…` (cloud path unverified — §12 note (a)).
- **S5 semantics (active):** `deletedAt = null` → normal views; non-null → trash view only; hard delete after 7 days in trash. API list param `trash=true` (`trash=1` NOT accepted by the API; the UI hash uses `trash=1` and maps to `true`).
- **Upload storage (demo):** `db/uploads/<uuid>.<allowlisted-ext>` — gitignored, runtime data (see §4 D-note and §10).

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), **firebase ^11 (auth + firestore + storage — `getFirebaseStorage` added in step 26 uses the SAME firebase package; no new package)**, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner (toasts), lucide-react, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`. **Steps 25 and 26 added ZERO runtime dependencies** (ECC = markdown skills only; S6/QE/P3 use existing packages).

## 7. Tests & Quality Status

- **Owner rule: no test code.** `scripts/rules-test.ts` (Firestore rules assertions — **39/39 PASS**, last run at the G1 rules change) and `scripts/e2e-verify.sh` (15/15 at Firebase-phase time) are verification scripts run on demand against the emulator (`bun scripts/rules-test.ts` — run with bun, NOT tsx). **Step 26 honesty: `firestore.rules` was NOT modified in step 26 (S6 fields already whitelisted; upload serving is a plain API route, not rules-governed), so no rules-test re-run was needed and none is claimed — the file is untouched since the 39/39 pass.**
- **Lint:** `bun run lint` (= `eslint .`) **CLEAN — re-verified at the step-26 close-out (2026-11-07), exit 0, zero problems.**
- **Type check:** `bunx tsc --noEmit` — **no errors under `src/` at the step-26 close-out** (pre-existing noise only in `examples/` (socket.io module stubs) and `skills/image-edit`: 3 error lines, none under `src/`).
- **Browser verification (mandatory per step):** agent-browser @1280/390, fa+en. **Step 26 full DoD verified live in demo mode** — S6 (10-item batch categorize → `updated:10` + counter 2→12 + toast «۱۰ مورد دسته‌بندی شد»; bulk delete + 7 s undo toast; trash restore-only bar + bulk-restore; EN pass; mobile 390 bar above nav, FAB hidden during selection), QE typeahead («آم» → ranked suggestion + keyboard pick), P3 (real PNG upload via UI → preview + auto title → note card renders the real image; serving probe `200 image/png`; security probes traversal→400 / `.exe`→415 / extension-less→415). Page errors: 0; console errors: 0. Evidence: `roadmaps/evidence/p4-*.png`.
- **Liveness checks (step 26, verified):** `ls src/app/api/notes/bulk src/app/api/upload 2>/dev/null` → both exist · `ls roadmaps/evidence/p4-*.png | wc -l` → **11** · `ls skills | grep -c '^ecc-'` → **11** · `ls skills/*/SKILL.md | wc -l` → **30** · dev.log tail: API 200s + Prisma queries + `✓ Compiled`.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must revoke old PAT and issue a fine-grained PAT (this repo, Contents: R/W). Re-tested 2026-11-05: `git push --dry-run origin main` → `could not read Username`. | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–4 + ECC layer) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed at least THREE times by platform rollbacks (latest: found MISSING at the step-25 close-out push, 2026-11-07) and rebuilt each time** | **Verified PRESENT at the v26 close-out** (no rebuild needed this step); pushed + parity proven at close-out (SHAs in §9/worklog Step 26; re-runnable via §9 live check). Rebuild after any wipe (1 command): `git init --bare /home/z/my-project-backup.git && git push backup main` |
| Uploaded files (`db/uploads/`) | ⚠️ Runtime data, NOT in the repo (gitignored by design) | Demo uploads are user data at runtime; committing them would leak test attachments into the repo | A fresh clone has an empty `db/uploads/` (directory is auto-created by the upload route). Previously uploaded attachments are recoverable **only by re-uploading**. Cloud mode stores files in Firebase Storage per-UID (`users/{uid}/files/…`) once that path goes live. |
| P3 cloud upload path | ⚠️ **Unverified** | No storage emulator in `firebase.json`; real Firebase project frozen (no credentials) | Needs owner-side Storage bucket + storage rules; on the Cloud-Go-Live backlog (§12 note (a)). Code shipped and honest-scoped. |
| ECC upstream provenance | ✅ Recorded in-repo | ECC source lives upstream (github.com/affaan-m/ecc, MIT); installed copies are committed here (`skills/ecc-*`, force-added) | Re-clone ECC at the recorded commit `d2ef268…` and re-run the documented security sweep + checksums, per `docs/ECC-INSTALL.md` and `AGENTS.md`. |
| Non-ECC harness skills (`skills/` minus `ecc-*`) | ⚠️ Outside the repo (gitignored by platform policy, line 54) | Platform scaffold ignores `/skills/`; only the 11 ECC folders were force-added | Re-provisioned by the platform harness / reinstall docs (`docs/ENVIRONMENT.md` §4); not project data. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; demo sample reseeded via `POST /api/seed` (canonical 23/8/16); not product data loss. |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders in `.env`; production cloud persistence NOT verified (honest). |
| Emulator data (probe user + G1 test docs) | ⚠️ Ephemeral emulator state (untracked) | Emulator suite is runtime-only | Recreate anytime: start emulators, sign up a fresh user via UI; G1 tests are re-runnable (worklog Step 22 documents the exact commands). |
| Dev server, emulator processes | ⚠️ Not persistent | Process state | `bun run dev`; `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–4, and the ECC layer) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential — with the explicit exception of `db/uploads/` attachments (runtime data, re-creatable only by re-upload, §4 D-note). Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v26 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | Clean of tracked modifications at close-out (the v26 docs commit is the last commit; only gitignored runtime/tool noise may appear — `.zscripts/dev.pid` was committed by the platform's auto-commit `d5d6af3` and had no diff at close-out) — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` 2026-11-05: `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`; **push blocked (no credential)**; unchanged at v26 |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed + parity proven every step; **verified PRESENT at v26 close-out (no rebuild needed this step)** → pushed → parity EQUAL (LOCAL `git rev-parse HEAD` == REMOTE `git ls-remote backup refs/heads/main`, proven at close-out; actual SHAs in worklog Step 26) |
| Local HEAD at v26 | see `git rev-parse HEAD`. Chain: … S2 `8d93733` → `c0f31b6` (platform auto-commit) → ECC install `9361459` → v25 docs commit `c733e50` → **`d5d6af3`** (platform auto-commit, UUID-titled message `75d68651-4150-4054-b49b-9bb62896426b`; committed `.zscripts/dev.pid` + the 10 re-rendered `s2-*/s5-*.png` copies + a `tag-chips-input.tsx` mode change — i.e. the pre-existing S2 close-out dirty state, now cleared) → **Phase-4 code commit `f70834c`** (`feat(s6,qe,p3): bulk operations, tag typeahead, real file upload (Phase 4)` — 33 files: 21 src + roadmap + 11 p4 evidence pngs) → **v26 snapshot/docs commit (docs-only: SNAPSHOT + worklog — the live HEAD)** — 29+ commits ahead of frozen origin |
| Phase status | **Phases 1–4 ✅ COMPLETE (Phase 4 = step 26: S6 + QE-tagging + P3; G2 ⏸ owner-gated). Phase 5 (P1 Telegram bridge) awaits explicit owner order — FROZEN.** |

**Liveness checks (step 26; expected values verified 2026-11-07):**

```bash
ls src/app/api/notes/bulk src/app/api/upload 2>/dev/null   # → both exist
ls roadmaps/evidence/p4-*.png | wc -l   # → 11  (step brief said "8"; 11 exist on disk — all committed; recorded honestly)
ls skills | grep -c '^ecc-'             # → 11
ls skills/*/SKILL.md | wc -l            # → 30
```

Authoritative live check:

```bash
git rev-parse HEAD && git status --short \
 && git ls-remote backup refs/heads/main \
 && GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=true git -c credential.helper= ls-remote https://github.com/Sohrab1999/Savedmassagemanager1.git refs/heads/main
# backup/main must equal local HEAD; origin read anonymously shows its true (frozen) state.
```

## 10. Recovery Procedure (fresh environment, no chat history)

1. `git clone https://github.com/Sohrab1999/Savedmassagemanager1.git my-project` (public read; ⚠️ recovers only to `e5898b2` until owner pushes — then fully current). If a local `backup` mirror exists, prefer `git clone /home/z/my-project-backup.git` (fully current, includes the ECC skills).
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `AGENTS.md` (ECC workflow layer) → `docs/ECC-INSTALL.md` (ECC provenance/checksums) → `worklog.md`.
3. `bun install` · `.env` (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + `NEXT_PUBLIC_FIREBASE_*` emulator placeholders or real values) · `bun run db:push`. **Note: `db/uploads/` (demo attachments) is gitignored runtime data — a fresh clone starts with an empty uploads dir; uploaded attachments are re-creatable only by re-uploading (honest limitation, §4 D-note / §8).**
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately; cloud mode needs the emulator (`bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`) or real Firebase env. Demo sample data: `POST /api/seed` (canonical 23 notes / 8 categories / 16 tags).
5. **ECC skills (step 25):** a current `backup` clone already contains `skills/ecc-*` (committed force-added). If recovering from the FROZEN origin clone (≤ `e5898b2`) or the folders are ever missing: re-clone ECC at the recorded commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b` (or any later recorded commit), re-run the security sweep + checksums per `docs/ECC-INSTALL.md` §Cleanup & upgrade.
6. Resume from §1 "Next allowed step" / roadmap checkboxes (Phases 1–4 complete; Phase 5 P1 and the G2 decision await the owner).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure (items 1–5 of v8, unchanged).
2. **Full application build** (`be5caad`) + **Firebase Auth/Firestore integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1–QE7 + final regression. All committed, backup parity proven per step.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7 read consolidation (`6273298`) · S8 chunked writeBatch fan-outs (`4bf21a2`) · S1 server-side pagination both modes, 500-cap deleted (`5f9d004`) · S4 title/content editor (`6f392d2`) · S3 filters in URL hash (`49ccb44`) · close-out regression (`1dc294b`).
6. **Step 22 — G1 DONE (Phase 3 opens):** persistentLocalCache + multi-tab manager; `realtimeStore` with 3 uncapped onSnapshot listeners; ALL repository one-shot reads → live-store reads; realtime bridge in app-shell; demo 2 s polling; `deletedAt` plumbing (rules 39/39); DoD verified live on emulator (second-device push, tab2→tab1, offline queue + sync). SNAPSHOT v22.
7. **Step 23 — S5 DONE (undo delete):** soft-delete + restore + trash view + 7-day purge + undo-rate KPI (code shipped in `806d717`); fresh demo DoD verification (21→20→21; KPI «۱ از ۱ (۱۰۰٪)»), evidence review. SNAPSHOT v23.
8. **Step 24 — S2 DONE (capture unification — Phase 3 closes):** shared `tag-chips-input.tsx` for capture AND detail sheet; paste-URL→link detection; one `{tagNames}` patch; i18n fa+en; DoD verified live. SNAPSHOT v24.
9. **Step 25 — ECC workflow layer installed (agent tooling, no product-code change):** Manual Adaptation path; security sweep PASS; 11 curated skills (`skills/ecc-*`, force-added past the `/skills/` gitignore) + `AGENTS.md` + `docs/ECC-INSTALL.md`. **Commit `9361459f719cefc987e199fa1308abcba143e982`** + docs commit; backup mirror rebuilt (was missing) + parity proven; lint re-verified CLEAN. SNAPSHOT v25.
10. **Step 26 — PHASE 4 COMPLETE:** **S6 bulk operations** (`POST /api/notes/bulk` zod ≤500 ids; demo = ONE Prisma `updateMany`, cloud = ONE committed writeBatch via `batchedUpdate`; selection-mode UI with `bulkSelectMode` store flag, per-card `SelectToggle`, fixed action bar, trash restore-only, FAB hidden while selecting; 7-second batch-undo toast; `undo-metrics` count params; DoD live: 10 → `updated:10`, counter 2→12, toast «۱۰ مورد دسته‌بندی شد», trash bulk-restore, EN pass, mobile 390) + **QE-tagging typeahead** (`tag-chips-input` datalist → filtered cache-driven dropdown: startsWith→contains, `noteCount` ranking, ≤6, keyboard nav, ARIA, commit-on-blur preserved; both capture paths) + **P3 real file upload** (`src/server/storage.ts` 10 MB + allowlist + UUID keys under gitignored `db/uploads/`; `POST /api/upload` + `GET /api/files/[key]` regex/nosniff/immutable; quick-capture upload zone + preview + title-from-filename + causal errors; cloud `repository.uploadFile` via Firebase Storage — **honest: cloud path unverified**, no storage emulator, frozen project → Cloud-Go-Live backlog; security probes traversal→400 / `.exe`→415 / extension-less→415; serving probe 200 image/png). **G2 NOT implemented (owner gate — honest ⏸ in roadmap).** Lint clean; tsc clean under `src/`; page/console errors 0; evidence `p4-*.png` (11 committed). Demo DB re-seeded canonically (23/8/16) after the sandbox recycle wiped it. **Commit `f70834c419d7a81f74ee0b7a01101a3496f54768`** (feat(s6,qe,p3)…) + this docs commit; backup parity proven at close-out. SNAPSHOT v26.

## 12. Remaining Work & Known State

- **Phase 5 (await explicit owner order): P1 Telegram bridge — FROZEN** until the owner orders it. **G2 AI auto-organize ⏸ NOT implemented by design:** the prerequisite (S1+G1) is satisfied, but the roadmap itself requires a separate owner product decision («نیازمند تصمیم محصول جداگانه») — awaits the owner (roadmap carries an honest ⏸ status note, not a silent skip).
- **Cloud-Go-Live backlog:** **(new, step 26) P3 cloud upload verification — owner-side Storage bucket + storage rules, then live verification of `repository.uploadFile`/`getFirebaseStorage`;** password-reset link (QE7, real Email provider); composite-index completion in production console (`firestore.indexes.json` has 11 declared; G1 made most read-time composites unnecessary — prune at go-live review); optional server-side trash purge (Cloud Scheduler) to complement the client-side 7-day sweep.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7).
- **Honest note (a) — P3 cloud upload unverified:** the cloud `repository.uploadFile` path (Firebase Storage) could not be verified in this environment — `firebase.json` has no storage emulator and the real project is frozen without credentials. The demo path is fully verified live. Needs an owner-side bucket + storage rules (Cloud-Go-Live backlog).
- **Honest note (b) — G2 owner gate:** not a completion gap; a deliberate hold per the roadmap text (separate product decision). The prerequisite (S1+G1) is done.
- **Honest note (c) — demo-state recycle:** the sandbox recycle had emptied the SQLite demo DB mid-session; `POST /api/seed` restored the canonical sample (**23 notes / 8 categories / 16 tags**) before AND after verification (verification artifacts — the uploaded test note and the batch-categorize counter shift — were reset via re-seed; `db/uploads/` cleaned). This is expected demo-mode behavior (runtime DB), not data loss. The bulk-undo metric counter is per-device localStorage and unaffected by re-seed.
- **Honest note (d) — bulk-delete undo window timing:** the 7-second undo window of the bulk-delete toast expired between two CLI round-trips during live verification (agent-browser harness timing artifact, NOT an app bug). The restore path itself is proven by the trash bulk-restore DoD («۲ مورد بازگردانی شد») and the API probe (`BULK RESTORE updated:3`).
- **Honest note (e) — evidence count:** the step-26 task brief said "8 evidence pngs"; **11 `p4-*.png` files exist on disk and all 11 are committed** (recorded in §7/§9 liveness). Also: the pre-existing S2-close-out dirty state (10 `s2-*/s5-*.png` re-renders + `tag-chips-input.tsx` mode change + `.zscripts/dev.pid`) was cleared by the platform auto-commit `d5d6af3` immediately before this step's code commit — the v25 §12 "(b) uncommitted files" note is resolved.
- **Lint (standing):** re-verified CLEAN at the step-26 close-out (exit 0, zero problems). The step-25 install-brief "4706 problems" figure remains an unreproducible/transient observation — not current state.
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure" (fresh clone at a recorded commit → security sweep → re-copy 11 folders → re-record checksums → commit).

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump + date).
2. [x] Affected reference docs updated: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/ENVIRONMENT.md`, roadmap file, `worklog.md`. (Step 26 scope: SNAPSHOT + worklog + roadmap file (Phase 4 checkboxes); the other reference docs describe product decisions/phases, which did not change.)
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA.
4. [x] `git status` reviewed before commit — no essential file left untracked/unstaged; nothing essential only in temp locations. (Step 26: 21 src files + roadmap + 11 evidence pngs staged and verified exclusive; `.zscripts/dev.pid` was picked up by the platform auto-commit `d5d6af3` and had no diff at close-out; `tool-results/` is gitignored.)
5. [x] Commit with a descriptive message.
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer and Phase 4) today — except `db/uploads/` attachments (runtime data, re-upload to restore); true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
