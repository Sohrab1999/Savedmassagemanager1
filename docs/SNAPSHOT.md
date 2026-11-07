# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 27 · **Date:** 2026-11-07 · **Snapshot author:** Z.ai Code agent
> **v27 changelog:** **PRODUCT-STRATEGY ROADMAP REGISTERED (step 27, docs-only).** The owner-mandated senior Product-Strategist/UX-Researcher/AI-Product-Analyst analysis produced **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** — a second standard checkbox roadmap: current-state maturity audit, code-verified feature gaps, **N1–N10 feature cards** (name/problem/scenario/value/complexity/risk/MVP-or-later), 5-bucket categorization, **Top-10 priority table** (same formula as roadmap #1: (PI+UXI)×2−Cost−Risk), Feature Opportunity Map, value-vs-cost table, **10 explicit don't-add warnings**, and execution **phases 6–9** (continuing the numbering of `FEATURE-LIBRARY-UPGRADE-ROADMAP.md` phases 1–5). G2 formalized as the **«پکیج تصمیم G2»** owner decision (AI / rule-based / none) — still NOT implemented. Cross-ref added to `docs/ROADMAP.md` ("Product strategy wave — Next Value"). **Zero product-code / schema / dependency change** — docs only (SNAPSHOT + worklog + 2 roadmap files). Every gap claim was code-verified (grep evidence listed in worklog step 27): no Persian char normalization, no PWA manifest, no empty-trash/permanent-delete/purge countdown, no JSON import, StatCard non-clickable, tag rename absent, uncategorized filter exists but buried (`library-view.tsx:375-378`), Brief-IA Inbox/related-items/resurfacing gaps (brief problems #4/#6). Quality refreshed at this step: lint exit 0; tsc 0 errors under `src/`. No UI change → no browser evidence needed (honest scope; nothing verified live that was not live before).
> **v26 changelog (historical):** ROADMAP PHASE 4 COMPLETE — S6 bulk operations ✅ + QE-tagging typeahead ✅ + P3 real file upload ✅, all DoD-verified live (demo mode, fa/en, 1280/390); **G2 AI auto-organize ⏸ NOT implemented** (owner gate: the roadmap itself requires a separate product decision — honest ⏸ note left in the roadmap). P3 cloud path honest-unverified (no storage emulator in `firebase.json`; real project frozen) → Cloud-Go-Live backlog. Zero schema change (fields already existed), zero new runtime dependencies, Firestore rules untouched. Evidence: `roadmaps/evidence/p4-*.png` (11 files committed).
> **v25 changelog (historical):** ECC workflow layer installed (agent tooling, step 25) — 11 curated `skills/ecc-*` skills + `AGENTS.md` lifecycle + `docs/ECC-INSTALL.md` install record via the ECC Manual Adaptation path (security sweep PASS; provenance commit `d2ef268`). `/skills/` is gitignored → ECC folders were force-added to git.
> **Versioning note (honesty):** the step-25 task brief said "bump to v9", but the live file was already at **v24** (v9 was consumed by Phase 1 history long ago). The monotonic protocol bump landed at **v25**; no version numbers were regressed.
> **v8 note:** full rewrite — the pre-v8 snapshot predated the entire application build and was severely outdated.

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Roadmap #1 | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. Phases 1–5 with checkboxes, DoD per item, priority scoring, Keep/Change/Remove. **Phases 1–4 COMPLETE; Phase 5 (P1 Telegram bridge) FROZEN.** |
| Roadmap #2 (step 27) | **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** (2026-11-07) — owner-mandated senior Product-Strategist analysis; "Next Value" wave: N1–N10 + G2 decision package, phases **6–9**, Top-10 scoring, Opportunity Map, value-vs-cost, 10 warnings. **PROPOSAL STATE — no N-item may start without an explicit owner order** (same discipline that governed phases 1–4). |
| **Current gate** | **Two roadmaps registered, both awaiting owner orders.** Roadmap #1: Phase 5 (P1 Telegram bridge) ❄ FROZEN until explicit owner order; G2 ⏸ owner decision. Roadmap #2: N1–N10 execution waves 6–9 proposed — await owner's pick/order; the «پکیج تصمیم G2» (AI / rule-based / none) is the first decision the strategy roadmap asks the owner to make. After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md` install record. Manual Adaptation path (no native ECC target in this harness). Skills applied in step 27: `ecc-change-impact` (pre-change blast-radius: docs-only — no code/data/interface/test surface; rollback = revert of the two doc commits), `ecc-verification-loop` (deliverable + persistence evidence checks). See §2 "ECC workflow layer". |
| Development status | **Full application implemented and running** (see §2). **Phases 1–4 of roadmap #1 COMPLETE** (Phases 1–2 + G1/S5/S2 of Phase 3 verified on both modes; Phase 4 verified on demo mode — cloud-mode specifics honest-scoped, see §8/§12). |
| Next allowed step | **Await owner orders only:** (a) pick/execute strategy items N1–N10 (recommended order = §7 phases 6–9 of roadmap #2; N1 first), (b) rule on the G2 decision package, (c) order Phase 5 P1 Telegram bridge. KPI فاز ۴ (last executed): bulk in ONE batch (10 items → `updated:10`) + tagging quality + real file capture. Evidence: `roadmaps/evidence/p4-*.png` (11). |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up, honest "continue in demo mode" entry, emulator badge, not-configured fallback (this deployment has no real Firebase env → cloud sign-in works against the LOCAL Emulator Suite; production values absent).
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, 4 stat cards (non-interactive — flagged as gap N4 in roadmap #2), category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: search (300 ms debounce), filter toolbar (QE2), type/favorite/archived/category/tags filters (category Select includes «بدون دسته»/`none` — surfaced in roadmap #2 as N1), QE5 active-filters bar, **S1 (v18): paginated results — 30/page + «نمایش بیشتر / Load more ({n} remaining)»**; **S3 (v20): filters in the URL hash** `#/library?q=…&type=…&cat=…&tags=…&fav=1&arch=1&sort=…`; layout stays device-local; **S6 (v26): selection mode** (below).
  - **Categories**: category CRUD dialog + tags tab (create/filter/delete — **no tag rename**, gap noted in roadmap #2); QE3 clickable category cards (keyboard-accessible, ⋯ isolated).
  - **Settings**: profile, theme, language, JSON export (**no import yet — gap N2 in roadmap #2**), demo-data reset (demo-only), environment/about.
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types, title/content/url/mediaUrl, category, shared tag chips; **QE6 (v14): error-prevention save flow**; **S2 (v24): paste-link detection + shared tag chips**; **P3 (v26): real file upload for file/image type** (upload zone mirroring the allowlist, preview card, empty title auto-fills from the file name, causal errors, save disabled while uploading; image keeps the media-URL alternative until a file is uploaded; video/text flows unchanged).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing, **S4 (v19): title/content editing**; tag add/remove via the shared S2 chips component (with the v26 typeahead); favorite/archive/delete (confirm), open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, category chip; QE1 list rows (snippet + relative date, `ms-auto`); QE4 shared `TagChips` (max 2 + Persian `+N`); **S6 (v26): per-card `SelectToggle` checkbox in BOTH layouts**.
- **S6 BULK OPERATIONS (v26, demo DoD verified live):**
  - **Backend:** `POST /api/notes/bulk` (`src/app/api/notes/bulk/route.ts`) + `bulkNoteSchema` (`src/server/schemas.ts`, zod, ≤500 ids = Firestore writeBatch ceiling) + `bulkUpdateNotes` (`src/server/services/notes.ts`) — demo = ONE Prisma `updateMany` per action; state guards.
  - **Cloud:** `repository.bulkUpdateNotes` — ONE committed `writeBatch` per ≤500 chunk (S8 helpers), denormalized `category` ref kept in lockstep; `firestore.rules` needed NO change.
  - **UI:** selection mode via store flag `bulkSelectMode` (`src/stores/app-store.ts`; auto-off on leaving library) + `ListChecks` toolbar toggle + per-card checkboxes (both layouts) + fixed action bar (mobile: above bottom nav; desktop: centered bottom; capture FAB hides while selecting). Contextual actions: categorize (incl. «بدون دسته»), archive/unarchive, soft-delete with 7-second batch-undo toast, restore-only in trash view. `undo-metrics.recordDeletion/recordUndo` take a count.
  - DoD verified live: 10 selected → ONE batch → `updated:10`, category «آموزش» counter 2→12, toast «۱۰ مورد دسته‌بندی شد»; trash bulk-restore «۲ مورد بازگردانی شد»; EN/LTR pass; mobile 390. Evidence: `p4-s6-*.png`.
- **QE-TAGGING TYPEAHEAD (v26, cache-only, no AI):** `src/components/app/tag-chips-input.tsx` filtered dropdown: startsWith-first then contains, tiebreak by `noteCount` from the `useTags` cache; ≤6 suggestions; selected tags excluded; ↑/↓+Enter keyboard nav; first Escape closes the menu, second commits+blurs (S2 contract intact); mouse pick keeps focus; full ARIA combobox/listbox/activedescendant. Both capture paths upgrade at once. Evidence: `p4-qe-typeahead-fa.png`.
- **P3 REAL FILE UPLOAD (v26; demo verified live, cloud path honest-unverified):**
  - **Demo backend:** `src/server/storage.ts` (10 MB cap, extension allowlist jpg/jpeg/png/webp/gif/pdf/txt/md/csv, UUID-keyed storage under gitignored `db/uploads/`, regex-validated keys) + `POST /api/upload` (multipart) + `GET /api/files/[key]` (ext-derived content type, `X-Content-Type-Options: nosniff`, immutable cache). Client name NEVER reaches the filesystem. Security probes: traversal→400, `.exe`→415, extension-less→415; serving probe `200 image/png`.
  - **Cloud:** `repository.uploadFile` → Firebase Storage `users/{uid}/files/<uuid>-<safe-name>` + `getFirebaseStorage` (`src/services/firebase.ts`; storage-emulator connect is best-effort). **HONEST: unverified** — `firebase.json` has no storage emulator and the real project is frozen → owner-side bucket + storage rules required (Cloud-Go-Live backlog, §12).
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API over Prisma/SQLite (sample data, honestly labeled).
- **G1 REALTIME + OFFLINE (v22, Cloud mode):**
  - **`src/services/firebase.ts`** initializes Firestore with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`. Fallbacks: SSR → `getFirestore`; HMR re-init → existing instance; IndexedDB blocked → `memoryLocalCache`. DEV-ONLY debug hook `window.__savedboxFirestore.{goOffline,goOnline}` (emulator builds only). **v26 addition: `getFirebaseStorage` (Firebase Storage, best-effort emulator connect for P3).**
  - **`src/services/realtime.ts`** — `realtimeStore`: THREE permanent uncapped `onSnapshot` listeners per UID (notes/categories/tags) replacing EVERY one-shot read; live arrays + `ensureReady()` + `subscribe`/version + `getNoteById` + `mapNote`; includes the S5 7-day trash purge (batched, once per session).
  - **`src/services/repository.ts`** — reads derive from the live store; fan-outs target the live array → read-free and UNCAPPED. **v26 addition: `bulkUpdateNotes` (chunked committed writeBatch) + `uploadFile` (Storage).**
  - **`src/components/app/app-shell.tsx`** — realtime bridge: start on sign-in, coalesced (50 ms) `queryClient.invalidateQueries()`, full teardown on unmount/UID change/sign-out.
  - **`src/hooks/queries.ts`** — demo mode polls every 2 s (notes/stats/categories/tags, active tab only); cloud never polls.
  - **DoD verified live (2026-11-05):** second-device REST write appears without refresh; tab2-UI-write → tab1 without refresh; browser-offline write survives reload and syncs on reconnect; SDK-offline: cache browsing + latency-compensation + sync after `goOnline()`. Evidence: `roadmaps/evidence/g1-*.png` (5 files).
- **S2 CAPTURE UNIFICATION (v24, demo DoD verified live):** shared `tag-chips-input.tsx` (chips, Enter/`,`/`،` commit, Backspace-on-empty, commit-on-blur safety, dedup, RTL-safe; **v26 typeahead with `noteCount`**); paste-link detection (title paste → type=link + URL filled + hint; QE6 precedence preserved); detail-sheet tag mutation = one list-based `patchNote({tagNames})`.
- **S5 UNDO DELETE (v23, demo DoD verified live):** soft delete end-to-end (`deletedAt` both modes) + restore; 7-day auto-purge both modes; trash UX with 7-second undo toast; trash view + «سطل» chip (deep-link `trash=1`); **v26: trash view selection mode is restore-only.** Undo-rate KPI: `src/lib/undo-metrics.ts` shown in Settings → About.
- **S7→S8→S1→S4→S3 (Phase 2, v16–v20) remain in force**, with G1-era updates: (a) the S7 TTL snapshot and S1 cloud structured path were REPLACED by the G1 live store; (b) fan-outs have no 500-note lookup cap.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (owner-only, field validation incl. optional `deletedAt`, catch-all deny), `firestore.indexes.json`, `scripts/rules-test.ts` (**39/39 pass** — rules UNCHANGED since, incl. steps 26–27), `scripts/e2e-verify.sh` (15/15 at Firebase-phase time).
- **i18n/RTL**: type-safe flat dictionaries fa+en (`src/lib/i18n/dictionaries.ts` — fa default; v26 strings added in both), `dir` synced, Persian digits, Vazirmatn.
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
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore`; UI pagination is presentation over the full local set; demo list remains server-paginated (30/page) with 2 s polling.**
- **S6 bulk contract (v26):** `POST /api/notes/bulk` — body `{ids: string[1..500], action: "categorize"|"archive"|"unarchive"|"delete"|"restore", categoryId?: string|null}` (`categoryId` required for `categorize`; `null` = uncategorize) → `{ok: true, updated: number}`; invalid → 400 (zod or `category-not-found`); 500 = internal. Cloud equivalent = `repository.bulkUpdateNotes` (one committed writeBatch per ≤500 chunk). Types: `BulkNotesInput`/`BulkNotesResponse` in `src/lib/domain/types.ts`.
- **P3 upload contract (v26):** `POST /api/upload` — multipart, server cap **10 MB** (`MAX_UPLOAD_BYTES`), extension allowlist jpg/jpeg/png/webp/gif/pdf/txt/md/csv (`FILE_CONTENT_TYPES` in `src/server/storage.ts`); rejects 415 (unsupported), 413-class (too large), 400 (no file/missing type). Success → `{url, fileName, fileSize}`; stored key = server UUID + allowlisted ext under gitignored `db/uploads/` (demo). `GET /api/files/[key]` — key regex-validated (`isValidFileKey`), content type derived from stored extension (never the client header), `nosniff`, immutable cache. Cloud: `repository.uploadFile` → Firebase Storage `users/{uid}/files/…`.
- **Firebase Emulator Suite (running in-sandbox for cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). `.env` has emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true`. **No storage emulator configured — the P3 cloud path therefore has no local verification target.** Bulk data via Firestore REST `:commit` with `Authorization: Bearer owner`; nullable strings MUST be `{"nullValue": null}`. Probe UID (G1 session): `94ZKYTmgH7xJibbkfR0RUY7vPDDT` (`tool-results/g1-probe-uid.txt`, untracked).
- **State:** Zustand (view/detailNoteId/captureOpen/filters/bulkSelectMode (S6)) + TanStack Query (UID-scoped keys; invalidations from mutations AND the realtime bridge).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa` (`src/lib/i18n/dictionaries.ts`); `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e scripts are verification scripts run on demand.
- **Agent tooling contract (ECC):** ECC skills are markdown guidance activated via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` is the advisory workflow layer. No hook runtime, no slash commands. Upgrade procedure = fresh ECC clone at a recorded commit + security sweep + re-record checksums (`AGENTS.md` / `docs/ECC-INSTALL.md`).
- **Phase-3 note:** G1 intentionally supersedes S1's cloud structured-query path (documented in repository.ts header).
- **Phase-4 note:** S6/P3 kept the G1 architecture — bulk writes go through the repository (live-store-aware), uploads go through a dedicated server module (`storage.ts`) + routes; no view owns listeners; no new state library.
- **Step-27 note (docs-only):** roadmap #2 introduces NO technical contract changes. Future-contract hints recorded honestly inside the roadmap itself (e.g. N2 import merge strategy, N9 SSRF fetcher threat model) bind only when the owner orders the item and it is implemented.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding, re-issued with Phase 2/3 orders):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست» — snapshot, docs, commit AND push must each be evidenced.
- **Strategy-roadmap status (step 27):** `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` is an ANALYSIS/PROPOSAL document, not a decision set. It creates no new approved decisions. It asks the owner for three orders: (a) N1–N10 execution waves (recommended N1 first), (b) the G2 ruling (AI / rule-based / none → to be recorded in `docs/DECISIONS.md` once given), (c) the P1/Phase-5 order. Until then, roadmap #1's frozen statuses stand.
- **D-note (step 26, honest):** uploaded files live OUTSIDE the repo (`db/uploads/` is gitignored by design) — they are **runtime data, not repo content**: a fresh clone has an empty uploads dir and previously uploaded attachments are recoverable **only by re-uploading**. This is recorded in §8, §10 and §12. (The roadmap itself gates G2 on a separate owner product decision — honored, not implemented.)

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO` (…, isFavorite, isArchived, deletedAt, savedAt, updatedAt), `CategoryDTO`, `TagDTO` (with `noteCount` — feeds the v26 typeahead ranking), `StatsDTO`, `ProfileDTO`, `NoteFilters` (+ `trash?: boolean`, pageToken/pageSize), `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`; `BulkNotesInput`, `BulkNotesResponse`, `UploadedFileInfo` (v26, used by the S6/P3 contracts in §3). **No v27 change.**
- **Schema honesty (steps 26–27): NO schema change in either step.** P3 reuses the long-existing `NoteDTO.mediaUrl/fileName/fileSize` fields; S6 operates on existing boolean/category fields; step 27 touched no code at all.
- **Demo mode:** Prisma/SQLite (`prisma/schema.prisma` — Note/`deletedAt DateTime?` + `@@index([deletedAt])`/Category/Tag/NoteTag/Profile), sample data seeded (canonical 23 notes / 8 categories / 16 tags via `POST /api/seed`; runtime DB may legitimately drift — re-seedable, §12 note (c)).
- **Cloud mode:** Firestore docs per `src/domain/types.ts` (NoteDoc/CategoryDoc/TagDoc/ProfileDoc) under `users/{uid}/…`; rules whitelist `deletedAt`; uploaded files → Firebase Storage `users/{uid}/files/…` (cloud path unverified — §12 note (a)).
- **S5 semantics (active):** `deletedAt = null` → normal views; non-null → trash view only; hard delete after 7 days in trash. API list param `trash=true` (`trash=1` NOT accepted by the API; the UI hash uses `trash=1` and maps to `true`).
- **Upload storage (demo):** `db/uploads/<uuid>.<allowlisted-ext>` — gitignored, runtime data (see §4 D-note and §10).

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), **firebase ^11 (auth + firestore + storage — `getFirebaseStorage` added in step 26 uses the SAME firebase package; no new package)**, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner (toasts), lucide-react, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`. **Steps 25, 26 and 27 added ZERO runtime dependencies** (ECC = markdown skills only; S6/QE/P3 use existing packages; step 27 is docs-only).

## 7. Tests & Quality Status

- **Owner rule: no test code.** `scripts/rules-test.ts` (Firestore rules assertions — **39/39 PASS**, last run at the G1 rules change) and `scripts/e2e-verify.sh` (15/15 at Firebase-phase time) are verification scripts run on demand against the emulator (`bun scripts/rules-test.ts` — run with bun, NOT tsx). `firestore.rules` is untouched since the 39/39 pass (no step 26–27 change), so no rules-test re-run was needed and none is claimed.
- **Lint:** `bun run lint` (= `eslint .`) **CLEAN — re-verified at the step-27 close-out (2026-11-07), exit 0, zero problems.**
- **Type check:** `bunx tsc --noEmit` — **no errors under `src/` at the step-27 close-out** (pre-existing noise only in `examples/` (socket.io module stubs) and `skills/image-edit`: 3 error lines, none under `src/`).
- **Browser verification (mandatory per step that touches UI):** agent-browser @1280/390, fa+en. **Step 27 is docs-only (no UI change) → no browser evidence required or claimed**; the last live UI verification stands at step 26 (full DoD, page/console errors 0; evidence `roadmaps/evidence/p4-*.png`).
- **Liveness checks (step 27):** `ls src/app/api/notes/bulk src/app/api/upload 2>/dev/null` → both exist · `ls roadmaps/evidence/p4-*.png | wc -l` → **11** · `ls skills | grep -c '^ecc-'` → **11** · `ls skills/*/SKILL.md | wc -l` → **30** · dev.log: API 200s + Prisma queries + `✓ Compiled` · `ls roadmaps/PRODUCT-STRATEGY-ROADMAP.md` → exists (§9).
- **Code-verification evidence for roadmap #2's gap claims (step 27, grep-based):** no char-normalization in search (`normalize|ي|ك` → 0 hits in `src/`); no `public/manifest*` / `src/app/manifest*`; no «empty trash / purge countdown» strings in dictionaries; settings-view has no import mutation (only `useResetSeed`/`useUpdateProfile`); `StatCard` (dashboard-view.tsx:23) has no onClick; tags expose only `createTag`/`deleteTag` (queries.ts:241-254); category Select item `none` = «بدون دسته» exists (library-view.tsx:375-378) but no dashboard counter surface.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must revoke old PAT and issue a fine-grained PAT (this repo, Contents: R/W). Re-tested 2026-11-05: `git push --dry-run origin main` → `could not read Username`. | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–4 + ECC layer + both roadmaps) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed at least THREE times by platform rollbacks (latest: found MISSING at the step-25 close-out push, 2026-11-07) and rebuilt each time** | **Verified PRESENT at the v26 and v27 close-outs** (no rebuild needed); pushed + parity proven at close-out (SHAs in §9/worklog Step 27; re-runnable via §9 live check). Rebuild after any wipe (1 command): `git init --bare /home/z/my-project-backup.git && git push backup main` |
| Uploaded files (`db/uploads/`) | ⚠️ Runtime data, NOT in the repo (gitignored by design) | Demo uploads are user data at runtime; committing them would leak test attachments into the repo | A fresh clone has an empty `db/uploads/` (directory is auto-created by the upload route). Previously uploaded attachments are recoverable **only by re-uploading**. Cloud mode stores files in Firebase Storage per-UID (`users/{uid}/files/…`) once that path goes live. |
| P3 cloud upload path | ⚠️ **Unverified** | No storage emulator in `firebase.json`; real Firebase project frozen (no credentials) | Needs owner-side Storage bucket + storage rules; on the Cloud-Go-Live backlog (§12 note (a)). Code shipped and honest-scoped. |
| ECC upstream provenance | ✅ Recorded in-repo | ECC source lives upstream (github.com/affaan-m/ecc, MIT); installed copies are committed here (`skills/ecc-*`, force-added) | Re-clone ECC at the recorded commit `d2ef268…` and re-run the documented security sweep + checksums, per `docs/ECC-INSTALL.md` and `AGENTS.md`. |
| Non-ECC harness skills (`skills/` minus `ecc-*`) | ⚠️ Outside the repo (gitignored by platform policy, line 54) | Platform scaffold ignores `/skills/`; only the 11 ECC folders were force-added | Re-provisioned by the platform harness / reinstall docs (`docs/ENVIRONMENT.md` §4); not project data. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; demo sample reseeded via `POST /api/seed` (canonical 23/8/16); not product data loss. |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders in `.env`; production cloud persistence NOT verified (honest). |
| Emulator data (probe user + G1 test docs) | ⚠️ Ephemeral emulator state (untracked) | Emulator suite is runtime-only | Recreate anytime: start emulators, sign up a fresh user via UI; G1 tests are re-runnable (worklog Step 22 documents the exact commands). |
| Dev server, emulator processes | ⚠️ Not persistent | Process state | `bun run dev`; `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. Roadmap #2's full analysis text is in the repo file itself (not chat-only). |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–4, both roadmaps, and the ECC layer) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential — with the explicit exception of `db/uploads/` attachments (runtime data, re-creatable only by re-upload, §4 D-note). Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v27 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | Clean of tracked modifications at close-out (the v27 docs commit is the last commit; only gitignored runtime/tool noise may appear) — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` 2026-11-05: `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`; **push blocked (no credential)**; unchanged at v27 |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed + parity proven every step; **verified PRESENT at v27 close-out (no rebuild needed this step)** → pushed → parity EQUAL (LOCAL `git rev-parse HEAD` == REMOTE `git ls-remote backup refs/heads/main`, proven at close-out; actual SHAs in worklog Step 27) |
| Local HEAD at v27 | see `git rev-parse HEAD`. Chain: … Phase-4 code commit `f70834c` → v26 docs commit `aec5acf` → **step-27 strategy deliverable commit (`docs(strategy): …` — adds `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` + `docs/ROADMAP.md` cross-ref)** → **v27 snapshot/worklog docs commit (the live HEAD)** — 31+ commits ahead of frozen origin |
| Phase status | **Roadmap #1: Phases 1–4 ✅ COMPLETE (Phase 4 = step 26: S6 + QE-tagging + P3; G2 ⏸ owner-gated). Phase 5 (P1 Telegram bridge) awaits explicit owner order — FROZEN. Roadmap #2 (step 27): N1–N10 waves 6–9 PROPOSED — awaiting owner orders.** |

**Liveness checks (step 27; expected values verified 2026-11-07):**

```bash
ls roadmaps/PRODUCT-STRATEGY-ROADMAP.md        # → exists (roadmap #2)
ls src/app/api/notes/bulk src/app/api/upload 2>/dev/null   # → both exist
ls roadmaps/evidence/p4-*.png | wc -l   # → 11
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
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (roadmap #1) → **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (roadmap #2, step 27)** → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `AGENTS.md` (ECC workflow layer) → `docs/ECC-INSTALL.md` (ECC provenance/checksums) → `worklog.md`.
3. `bun install` · `.env` (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + `NEXT_PUBLIC_FIREBASE_*` emulator placeholders or real values) · `bun run db:push`. **Note: `db/uploads/` (demo attachments) is gitignored runtime data — a fresh clone starts with an empty uploads dir; uploaded attachments are re-creatable only by re-uploading (honest limitation, §4 D-note / §8).**
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately; cloud mode needs the emulator (`bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`) or real Firebase env. Demo sample data: `POST /api/seed` (canonical 23 notes / 8 categories / 16 tags).
5. **ECC skills (step 25):** a current `backup` clone already contains `skills/ecc-*` (committed force-added). If recovering from the FROZEN origin clone (≤ `e5898b2`) or the folders are ever missing: re-clone ECC at the recorded commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b` (or any later recorded commit), re-run the security sweep + checksums per `docs/ECC-INSTALL.md` §Cleanup & upgrade.
6. Resume from §1 "Next allowed step" / the two roadmap files' checkboxes (roadmap #1: phases 1–4 done, phase 5 + G2 await owner; roadmap #2: waves 6–9 + G2 decision package await owner).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure (items 1–5 of v8, unchanged).
2. **Full application build** (`be5caad`) + **Firebase Auth/Firestore integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1–QE7 + final regression. All committed, backup parity proven per step.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7 read consolidation (`6273298`) · S8 chunked writeBatch fan-outs (`4bf21a2`) · S1 server-side pagination both modes, 500-cap deleted (`5f9d004`) · S4 title/content editor (`6f392d2`) · S3 filters in URL hash (`49ccb44`) · close-out regression (`1dc294b`).
6. **Step 22 — G1 DONE (Phase 3 opens):** persistentLocalCache + multi-tab manager; `realtimeStore` with 3 uncapped onSnapshot listeners; ALL repository one-shot reads → live-store reads; realtime bridge in app-shell; demo 2 s polling; `deletedAt` plumbing (rules 39/39); DoD verified live on emulator. SNAPSHOT v22.
7. **Step 23 — S5 DONE (undo delete):** soft-delete + restore + trash view + 7-day purge + undo-rate KPI; fresh demo DoD verification. SNAPSHOT v23.
8. **Step 24 — S2 DONE (capture unification — Phase 3 closes):** shared `tag-chips-input.tsx` for capture AND detail sheet; paste-URL→link detection; one `{tagNames}` patch; i18n fa+en; DoD verified live. SNAPSHOT v24.
9. **Step 25 — ECC workflow layer installed (agent tooling, no product-code change):** Manual Adaptation path; security sweep PASS; 11 curated skills (`skills/ecc-*`, force-added past the `/skills/` gitignore) + `AGENTS.md` + `docs/ECC-INSTALL.md`. **Commit `9361459f719cefc987e199fa1308abcba143e982`** + docs commit; backup mirror rebuilt (was missing) + parity proven; lint re-verified CLEAN. SNAPSHOT v25.
10. **Step 26 — PHASE 4 COMPLETE:** **S6 bulk operations** (`POST /api/notes/bulk`; demo = ONE Prisma `updateMany`, cloud = ONE committed writeBatch; selection-mode UI, fixed action bar, trash restore-only, 7-second batch-undo toast; DoD live: 10 → `updated:10`) + **QE-tagging typeahead** (cache-driven dropdown, `noteCount` ranking, ARIA, both capture paths) + **P3 real file upload** (`src/server/storage.ts` 10 MB + allowlist + UUID keys; `POST /api/upload` + `GET /api/files/[key]`; quick-capture upload zone + preview + title-from-filename; cloud `repository.uploadFile` — **honest: cloud path unverified** → Cloud-Go-Live backlog; security probes passed). **G2 NOT implemented (owner gate).** Lint clean; tsc clean under `src/`; page/console errors 0; evidence `p4-*.png` (11 committed). Demo DB re-seeded canonically (23/8/16) after the sandbox recycle wiped it. **Commit `f70834c419d7a81f74ee0b7a01101a3496f54768`** + docs commit; backup parity proven. SNAPSHOT v26.
11. **Step 27 — PRODUCT-STRATEGY ROADMAP REGISTERED (docs-only):** owner-mandated senior Product-Strategist/UX-Researcher/AI-Product-Analyst analysis → **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** (roadmap #2): current-state maturity audit, code-verified gaps (every claim grep-evidenced), N1–N10 feature cards (full 7-field format), 5-bucket categorization, Top-10 scoring ((PI+UXI)×2−Cost−Risk; N1=14, N3=13, N9/N8/N7=11/10, …), Feature Opportunity Map, value-vs-cost table, 10 don't-add warnings, execution **phases 6–9** with DoD per item, North-Star additions (Organize Debt→0, Resurrect Rate, Data Round-trip). G2 formalized as «پکیج تصمیم G2» (AI / rule-based / none) — still owner-gated. Cross-ref added to `docs/ROADMAP.md`. ECC skills applied: `ecc-change-impact` (docs-only blast radius) + `ecc-verification-loop`. Zero code/schema/deps change; lint exit 0 + tsc 0-under-src re-verified at close-out. **Commit = "docs(strategy): …" (strategy roadmap + ROADMAP.md cross-ref)** + this docs commit; backup parity proven at close-out (SHAs in worklog Step 27). SNAPSHOT v27.

## 12. Remaining Work & Known State

- **Roadmap #1:** **Phase 5 (await explicit owner order): P1 Telegram bridge — FROZEN** until the owner orders it. **G2 AI auto-organize ⏸ NOT implemented by design:** the prerequisite (S1+G1) is satisfied, but the roadmap itself requires a separate owner product decision — the step-27 strategy roadmap now formalizes that decision as the «پکیج تصمیم G2» (options AI / rule-based / none; ruling to be recorded in `docs/DECISIONS.md`).
- **Roadmap #2 (step 27, PROPOSAL — awaits owner orders):** waves 6–9 — فاز ۶ stable-launch (N1 inbox, N3 Persian search normalization+highlight, N2 JSON import w/ guardrails) · فاز ۷ daily-UX (N4 interactive dashboard, N5 trash management, N10 duplicate detection) · فاز ۸ retention (N6 related notes, N7 resurfacing, N8 PWA) · فاز ۹ intelligence-gated (N9 SSRF-safe link enrichment, G2 ruling, optional insights). **No N-item starts without an explicit owner order.**
- **Cloud-Go-Live backlog:** P3 cloud upload verification — owner-side Storage bucket + storage rules, then live verification of `repository.uploadFile`/`getFirebaseStorage`; password-reset link (QE7, real Email provider); composite-index completion in production console (`firestore.indexes.json` has 11 declared; G1 made most read-time composites unnecessary — prune at go-live review); optional server-side trash purge (Cloud Scheduler) to complement the client-side 7-day sweep.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7); **plus the three strategy-roadmap orders (N-items, G2 ruling, P1).**
- **Honest note (a) — P3 cloud upload unverified:** the cloud `repository.uploadFile` path (Firebase Storage) could not be verified in this environment — `firebase.json` has no storage emulator and the real project is frozen without credentials. The demo path is fully verified live. Needs an owner-side bucket + storage rules (Cloud-Go-Live backlog).
- **Honest note (b) — G2 owner gate:** not a completion gap; a deliberate hold per the roadmap texts (both #1 and #2). The prerequisite (S1+G1) is done.
- **Honest note (c) — demo-state recycle:** the sandbox recycle had emptied the SQLite demo DB mid-step-26; `POST /api/seed` restored the canonical sample (23/8/16). This is expected demo-mode behavior (runtime DB), not data loss. The bulk-undo metric counter is per-device localStorage and unaffected by re-seed.
- **Honest note (d) — bulk-delete undo window timing:** the 7-second undo window of the bulk-delete toast expired between two CLI round-trips during live verification (agent-browser harness timing artifact, NOT an app bug). The restore path itself is proven by the trash bulk-restore DoD and the API probe.
- **Honest note (e) — evidence count:** the step-26 task brief said "8 evidence pngs"; **11 `p4-*.png` files exist on disk and all 11 are committed.** The pre-existing S2-close-out dirty state was cleared by the platform auto-commit `d5d6af3` — the v25 "(b) uncommitted files" note is resolved.
- **Step-27 honesty:** docs-only step → no browser evidence and no screenshot set produced, intentionally (nothing in the UI changed; claiming new UI evidence would be false). Roadmap #2's competitor notes are qualitative/strategic judgments, not benchmarked claims — marked as such in the document.
- **Lint (standing):** re-verified CLEAN at the step-27 close-out (exit 0, zero problems). The step-25 install-brief "4706 problems" figure remains an unreproducible/transient observation — not current state.
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure" (fresh clone at a recorded commit → security sweep → re-copy 11 folders → re-record checksums → commit).

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump v27 + date).
2. [x] Affected reference docs updated: `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (new deliverable), `docs/ROADMAP.md` (cross-ref section), `worklog.md`. Step 27 scope honesty: `docs/DECISIONS.md`/`docs/CHANGELOG.md`/`docs/ENVIRONMENT.md` unchanged — no decision was made and no environment aspect changed (a proposal creates no ruling).
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA (§9; SHAs in worklog Step 27).
4. [x] `git status` reviewed before commit — deliverable + docs staged and verified exclusive; nothing essential left in temp locations (`tool-results/` is gitignored).
5. [x] Commit with a descriptive message (two commits: deliverable, then snapshot/worklog).
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer, Phase 4 and both roadmaps) today — except `db/uploads/` attachments (runtime data, re-upload to restore); true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
