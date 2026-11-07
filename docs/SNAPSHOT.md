# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 28 · **Date:** 2026-11-07 · **Snapshot author:** Z.ai Code agent
> **v28 changelog:** **STRATEGY WAVE 6 OPENED — N1 + N2 COMPLETE (step 28, owner order).** **N1 visible Inbox:** `StatsDTO.uncategorized` (demo COUNT + cloud live-array count — exactly the `cat=none` view), dashboard Inbox card (count badge → one click → `#/library?cat=none`, explicit zero state «همهٔ موارد دسته‌بندی شده‌اند — تمیز!» with aria-live), visible «بدون دسته» FilterChip in the library toolbar; S6 synergy proven live (12 uncategorized → select 10 → ONE bulk batch → toast → card 2 → zero). **N2 JSON import:** shared zod schema `src/lib/domain/import-schema.ts` (accepts BOTH export shapes via `app:"savedbox"`/`source:"firestore"` marker; anti-flood caps 1000 notes/200 cats/500 tags/20 MB body/15 MB file), demo service `src/server/services/import.ts` (ONE Prisma transaction; category=slug, tag=name, duplicate=exact type+title+url; NEVER deletes/updates; invalid items counted & skipped), `POST /api/import` (causal 400s), cloud `repository.importData` (same schema; `batchedSet` ≤500-op chunks + `batchedCreateTags` — S8 pattern; duplicates resolved from the live store read-free), Settings import card with the mandatory two-step guardrail (file → preview counts → explicit confirm) + exact merge report toast. **Verification (browser + API, fa/en, 1280/390):** demo round-trip = «۰ اضافه، ۲۳ تکرار رد» with total unchanged; modified file = «۲ اضافه، ۲۳ تکرار رد (۱ نامعتبر)، ۱ برچسب ساخته شد»; corrupt/no-marker/wrong-marker files → causal toasts; API probes (invalid-json 400, flood 1001→400, exact report shape); **cloud pass on the Emulator: fresh sign-up → import same file → «۲۵ اضافه، ۰ تکرار (۱ نامعتبر) — ۸ دسته و ۱۷ برچسب» through the REAL `firestore.rules` (rules-test re-run 39/39 the same session) + realtime propagation without refresh (library 25, inbox card 7 = 2+3+2 exact).** Zero schema change, zero new runtime dependencies (zod already present), `firestore.rules` untouched. Evidence: `roadmaps/evidence/n1-*.png` + `n2-*.png` (26 files). Honest notes: platform recycle mid-session wiped the demo SQLite DB (re-seeded 23/8/16 canonically before AND after verification) AND reverted `src/app/api/upload/route.ts` to a deleted state + changed file modes (restored from HEAD `git checkout -- .`) AND emptied the Firebase env placeholders from `.env` (re-added per the documented contract — gitignored runtime config); N3 deliberately NOT started (not in this owner order).
> **v27 changelog (historical):** PRODUCT-STRATEGY ROADMAP REGISTERED (docs-only) — `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0 (roadmap #2: N1–N10, phases 6–9, Top-10, Opportunity Map, warnings); G2 formalized as the owner decision package.
> **v26 changelog (historical):** ROADMAP PHASE 4 COMPLETE — S6 bulk ops ✅ + QE-tagging typeahead ✅ + P3 real file upload ✅ (demo DoD live); G2 ⏸ owner gate; P3 cloud path honest-unverified → Cloud-Go-Live backlog.
> **v25 changelog (historical):** ECC workflow layer installed — 11 curated `skills/ecc-*` + `AGENTS.md` + `docs/ECC-INSTALL.md` (Manual Adaptation path; security sweep PASS; provenance commit `d2ef268`; force-added past the `/skills/` gitignore).
> **Versioning note (honesty):** the step-25 task brief said "bump to v9", but the live file was already at **v24** (v9 was consumed by Phase 1 history long ago). The monotonic protocol bump landed at **v25**; no version numbers were regressed.

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Roadmap #1 | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. **Phases 1–4 COMPLETE; Phase 5 (P1 Telegram bridge) FROZEN.** |
| Roadmap #2 | **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** (2026-11-07) — "Next Value" wave: N1–N10 + G2 decision package, phases **6–9**. **Wave 6 OPENED (step 28, owner order): N1 ✅ + N2 ✅ — both DoD-verified in demo AND cloud modes. N3–N10 await owner orders.** |
| **Current gate** | **Strategy wave 6 in progress.** Owner's step-28 order covered N1 + N2 only (executed and verified). Remaining wave-6 item **N3 (Persian search normalization + highlight) awaits an explicit owner order**; waves 7–9 and the G2 ruling likewise await the owner. After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`. Skills applied in step 28: `ecc-change-impact` (pre-code blast radius: 12 code files + 2 new modules; no schema/rules/deps), `ecc-react-patterns`/`ecc-typescript-patterns` (component + typing work), `ecc-security-review` mindset (import threat model: flood caps, marker gate, strict zod, transaction, causal errors), `ecc-verification-loop` (gates: lint/tsc/API probes/live DoD/round-trip/cloud pass). |
| Development status | **Full application implemented and running** (see §2). **Roadmap #1 phases 1–4 COMPLETE; roadmap #2 wave 6: N1+N2 COMPLETE (both modes verified), N3 pending owner order.** |
| Next allowed step | **Await owner orders only:** (a) N3 execution order (remaining wave-6 item), (b) waves 7–9 picks, (c) the G2 ruling (AI / rule-based / none → recorded in `docs/DECISIONS.md`), (d) Phase 5 P1 Telegram bridge order (FROZEN). KPI فاز ۶ progress: inbox card zero-reachable in one session (verified); round-trip = 100% (verified); Persian search normalization = N3 (pending). Evidence: `n1-*.png`/`n2-*.png` (26). |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up (works against the LOCAL Emulator Suite), honest "continue in demo mode" entry, emulator badge, not-configured fallback.
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, **N1 Inbox card** (below), 4 stat cards (non-interactive — N4 candidate), category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: search (300 ms debounce), filter toolbar (QE2) with type chips + favorite/**N1 «بدون دسته» chip**/archived/trash chips + category Select (incl. `none`) + tags popover; QE5 active-filters bar; S1 paginated results (30/page + Load more); S3 filters in the URL hash `#/library?q=…&type=…&cat=…&tags=…&fav=1&arch=1&sort=…&trash=1`; **S6 selection mode** (below).
  - **Categories**: category CRUD dialog + tags tab (create/filter/delete — no tag rename, gap noted in roadmap #2); QE3 clickable category cards.
  - **Settings**: profile, theme, language, JSON export, **N2 JSON import card (below)**, demo-data reset (demo-only), environment/about (incl. undo-rate KPI).
- **N1 VISIBLE INBOX (v28, verified demo + cloud):**
  - **Data:** `StatsDTO.uncategorized` (src/lib/domain/types.ts) = live, non-archived notes with `categoryId: null` — exactly the view the library `cat=none` filter shows. Demo: one COUNT query (`src/server/services/stats.ts`). Cloud: `active.filter(n => !n.categoryId)` over the G1 live store (`repository.getStats`) — no extra reads.
  - **UI:** dashboard card between the capture banner and stats — when >0: a full-width BUTTON (Inbox icon + primary count badge + «{n} مورد بدون دسته منتظر سازمان‌دهی‌اند — یک کلیک، بعد دسته‌سازی گروهی.») → `setFilters({categoryId:"none"}) + setView("library")` → hash `#/library?cat=none` (S3). When 0: explicit non-interactive card (CheckCircle2 + «همهٔ موارد دسته‌بندی شده‌اند — تمیز!», aria-live="polite") — the zero state is never silent. Library toolbar: FilterChip «بدون دسته» (Inbox icon) toggling `categoryId` "none"⇄"all", consistent with QE5 (active-filters bar already renders «بدون دسته» for the `none` state).
  - **S6 synergy (DoD):** the card count IS the filtered list count; bulk categorize drains it (verified 12→10-batch→2→0 live).
- **N2 JSON IMPORT (v28, verified demo + cloud):**
  - **Shared validation** (`src/lib/domain/import-schema.ts`): zod — `importPayloadSchema` requires the Savedbox marker (`app:"savedbox"` (demo export) OR `source:"firestore"` (cloud export)) + `notes` array (1..1000); caps categories ≤200 / tags ≤500; `importNoteSchema` strictly validates every item (type enum, title ≤200, content ≤10000, http URL, `deletedAt` must be null — exports cover the live library only, `savedAt` must parse as a date, tags as names or {name} refs — both export shapes). Invalid ITEMS are skipped & counted; a corrupt FILE is a causal 400.
  - **Demo backend:** `src/server/services/import.ts` — ONE Prisma interactive transaction: categories matched by slug (missing created with appended `order`), tags resolved by name (missing created via pre-filtered `createMany`), notes deduped on `type|title|url` exact key and created with connectOrCreate tags + preserved `savedAt`; **import NEVER deletes or updates any existing record**. Route `POST /api/import` (`src/app/api/import/route.ts`): 20 MB body cap → 413 `import.too-large`; `import.invalid-json` / `import.not-a-savedbox-export` / `import.invalid-schema` causal 400s; returns `ImportReport {ok, notesAdded, notesSkippedDuplicates, notesSkippedInvalid, categoriesAdded, tagsAdded}` (types.ts).
  - **Cloud backend:** `repository.importData(payload)` — validates with the SAME shared schema client-side, dedups against the live store (read-free), then writes via `batchedSet` (new ≤500-op committed-batch helper) for categories + notes and `batchedCreateTags` for tags (S8 pattern); denormalized `category` ref built from the mapped CategoryDoc; realtime listeners surface everything automatically (no refresh needed). Verified through the real `firestore.rules` (39/39 the same session).
  - **UI:** Settings → Data card → «درون‌ریزی داده (JSON)» (`ImportSection` in settings-view.tsx): hidden file input (accept .json; client cap 15 MB → causal toast) → local `importPayloadSchema` validation → **preview panel** («{n} یادداشت · {n} دسته · {n} برچسب شناسایی شد» + merge hint) → explicit «درون‌ریزی و ادغام» confirm → exact report toast («{added} اضافه شد، {skipped} تکرار رد شد ({invalid} نامعتبر) — {categories} دسته و {tags} برچسب ساخته شد») → full cache invalidation (`useImportData`). Two-step guardrail mandatory — nothing is sent before the confirm.
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types, title/content/url/mediaUrl, category, shared tag chips; QE6 error-prevention save flow; S2 paste-link detection; **P3 real file upload for file/image type** (upload zone, preview card, title-from-filename, causal errors; demo verified; cloud path honest-unverified → Cloud-Go-Live backlog).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing, S4 title/content editing, tags via the shared S2 chips component (with QE typeahead), favorite/archive/delete (confirm), open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, category chip, QE1 list rows, QE4 shared TagChips (max 2 + +N), S6 per-card `SelectToggle`.
- **S6 BULK OPERATIONS (v26):** `POST /api/notes/bulk` (zod ≤500 ids) + `bulkNoteSchema` + `bulkUpdateNotes` — demo = ONE Prisma `updateMany` per action with state guards; cloud = ONE committed writeBatch per ≤500 chunk, denormalized category kept in lockstep. UI: selection mode (`bulkSelectMode` store flag), per-card checkboxes in both layouts, fixed action bar, trash restore-only, 7-second batch-undo toast. DoD verified live (v26) and re-exercised in v28 (N1 drain flow: 10 → `updated:10`).
- **QE-TAGGING TYPEAHEAD (v26, cache-only, no AI):** `tag-chips-input.tsx` filtered dropdown (startsWith→contains, `noteCount` ranking, ≤6, keyboard nav, ARIA). Both capture paths.
- **P3 REAL FILE UPLOAD (v26; demo verified live, cloud path honest-unverified):** `src/server/storage.ts` (10 MB, extension allowlist, UUID keys under gitignored `db/uploads/`) + `POST /api/upload` + `GET /api/files/[key]` (nosniff, immutable, traversal-safe). Cloud: `repository.uploadFile` → Firebase Storage `users/{uid}/files/…` — **unverified (no storage emulator; real project frozen) → Cloud-Go-Live backlog.**
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API over Prisma/SQLite. **v28 addition: `importData` dispatch (cloud = repository, demo = apiRoutes).**
- **G1 REALTIME + OFFLINE (v22, Cloud mode):** `persistentLocalCache` + multi-tab manager (`src/services/firebase.ts`); `realtimeStore` with 3 uncapped `onSnapshot` listeners per UID replacing every one-shot read (`src/services/realtime.ts`); repository reads derive from the live store; realtime bridge in app-shell (coalesced invalidations); demo polls 2 s. **v28 re-exercised: imported batches appeared in the UI without refresh.**
- **S5 UNDO DELETE (v23):** soft delete + restore + trash view + 7-day purge + undo-rate KPI. S2 CAPTURE UNIFICATION (v24): shared tag chips + paste-link detection. S7→S8→S1→S4→S3 (Phase 2) remain in force under the G1 architecture.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (**owner-only + field validation; UNCHANGED since the 39/39 pass — re-run green at step 28 against the new import write shapes**), `firestore.indexes.json`, `scripts/rules-test.ts` (**39/39**), `scripts/e2e-verify.sh` (15/15 at Firebase-phase time).
- **i18n/RTL**: type-safe flat dictionaries fa+en (`src/lib/i18n/dictionaries.ts` — fa default; **v28: N1 + N2 strings in both**), `dir` synced, Persian digits, Vazirmatn.
- **Platform compliance**: single user-visible route `/`; API routes under `src/app/api/**`; sticky-footer rules; shadcn/ui New York only.
- **ECC workflow layer (agent tooling — step 25, commit `9361459`):** 11 curated skills from [ECC](https://github.com/affaan-m/ecc) under `skills/ecc-*` (force-added past the `/skills/` gitignore; provenance commit `d2ef268`; bodies byte-identical, verified at install), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md` (checksums + honest boundaries: skills ✅ · agents/commands/hooks/rules-packs/memory/AgentShield ❌). Activation via the harness Skill tool — advisory process, no runtime enforcement.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route: `/`. API routes (`src/app/api/**`), not server actions.
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore`; demo list server-paginated (30/page) with 2 s polling.**
- **N1 contract (v28):** `StatsDTO.uncategorized` = live + non-archived + `categoryId null` — MUST stay identical to the library `cat=none` filter semantics on both backends (demo COUNT vs cloud live-array count).
- **N2 import contract (v28):** `POST /api/import` (demo) / `repository.importData` (cloud) — input = a Savedbox export payload (marker `app:"savedbox"` OR `source:"firestore"`; zod-validated in `src/lib/domain/import-schema.ts` — the SINGLE validation source for both backends); caps: ≤1000 notes / ≤200 categories / ≤500 tags / 20 MB server body / 15 MB client file; merge semantics: create-only (never update/delete), duplicate = exact `type|title|url`, category remap = payload categoryId → payload slug → server slug map, tag remap by name, invalid items skipped + counted; output = `ImportReport`. Cloud writes = committed writeBatches ≤500 ops (`batchedSet`).
- **S6 bulk contract (v26):** `POST /api/notes/bulk` — `{ids[1..500], action, categoryId?}` → `{ok, updated}`; cloud = one committed writeBatch per ≤500 chunk.
- **P3 upload contract (v26):** `POST /api/upload` multipart (10 MB, extension allowlist) → `{url, fileName, fileSize}`; `GET /api/files/[key]` regex-validated + nosniff + immutable. Cloud Storage path unverified (backlog).
- **Firebase Emulator Suite (in-sandbox, cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). **`.env` (gitignored runtime config) carries emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` — restored at step 28 after the platform recycle emptied them; values are demo identifiers, never real credentials.** No storage emulator configured (P3 cloud path has no local target). Probe UID for step-28 cloud pass: created fresh via UI sign-up (`n2-cloud@savedbox.local`, ephemeral emulator state).
- **State:** Zustand (view/detailNoteId/captureOpen/filters/bulkSelectMode) + TanStack Query (UID-scoped keys; invalidations from mutations AND the realtime bridge).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa` (`src/lib/i18n/dictionaries.ts`); `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e scripts are verification scripts run on demand.
- **Agent tooling contract (ECC):** skills = markdown guidance via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` = advisory workflow layer. Upgrade procedure per `AGENTS.md`/`docs/ECC-INSTALL.md`.
- **Phase-3 note:** G1 intentionally supersedes S1's cloud structured-query path. **Phase-4 note:** S6/P3 kept the G1 architecture. **Step-28 note:** N1/N2 also kept it — N1 counts derive from the existing stats pipeline (no new listeners); N2 cloud writes go through committed batches and land in the live store via the existing onSnapshot plumbing; no new state library, no schema change.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست».
- **Step-28 owner order:** «N1 — صندوق ورودی مرئی …» + «N2 — درون‌ریزی JSON …» verbatim from `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` §3 — i.e. the owner PICKED two items from the strategy roadmap, which is how wave 6 opened. N3 and everything else remains un-ordered. The G2 ruling is still pending (AI / rule-based / none).
- **Import merge policy (implementation-level, per the ordered N2 card):** create-only merge, no automatic deletion/overwrite — recorded here because it is a binding product-behavior contract, derived directly from the owner's ordered text («merge می‌کند» + «هیچ حذفی خودکار نمی‌شود» DoD).
- **D-note (step 26, still true):** uploaded files live OUTSIDE the repo (`db/uploads/` gitignored) — runtime data, recoverable only by re-uploading (§8/§10/§12).

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO`, `CategoryDTO`, `TagDTO` (noteCount), `StatsDTO` (**v28: + `uncategorized`**), `ProfileDTO`, `NoteFilters` (+ trash, pageToken/pageSize), `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`, `BulkNotesInput`/`BulkNotesResponse`, **`ImportReport` (v28)**, `UploadedFileInfo`.
- **Import validation schemas (v28):** `src/lib/domain/import-schema.ts` — `importPayloadSchema`, `importCategorySchema`, `importTagSchema`, `importNoteSchema`, `importNoteTagNames()`, caps constants (`IMPORT_MAX_NOTES/CATEGORIES/TAGS`). Shared by the demo route AND the cloud repository (single validation source).
- **Schema honesty: NO database schema change in v28** (no Prisma migration, no Firestore rules/indexes change). Import reuses the existing Note/Category/Tag models 1:1.
- **Demo mode:** Prisma/SQLite (`prisma/schema.prisma` — Note/Category/Tag/NoteTag/Profile), canonical seed 23 notes / 8 categories / 16 tags via `POST /api/seed` (re-seeded at step-28 close-out; see §12 notes).
- **Cloud mode:** Firestore docs per `src/domain/types.ts` under `users/{uid}/…`; rules whitelist unchanged; import writes = NoteDoc/CategoryDoc/TagDoc creates in batches (rules-verified).
- **S5 semantics:** `deletedAt = null` → normal views; non-null → trash only; hard delete after 7 days. API list param `trash=true` (UI hash `trash=1` maps to it).
- **Upload storage (demo):** `db/uploads/<uuid>.<allowlisted-ext>` — gitignored runtime data.

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), firebase ^11 (auth + firestore + storage), zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner, lucide-react, **zod (import validation reuses it — no new package)**, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`. **Steps 25–28 added ZERO runtime dependencies.**

## 7. Tests & Quality Status

- **Owner rule: no test code.** `scripts/rules-test.ts` (**39/39 PASS — re-run at step 28** against the emulator to insure the new import write shapes) and `scripts/e2e-verify.sh` (15/15 at Firebase-phase time) are verification scripts run on demand (`bun scripts/rules-test.ts` — bun, NOT tsx).
- **Lint:** `bun run lint` **CLEAN — exit 0 at the step-28 close-out.**
- **Type check:** `bunx tsc --noEmit` — **0 errors under `src/` at the step-28 close-out** (pre-existing noise only in `examples/` + `skills/image-edit`).
- **Browser verification (mandatory per UI step) — step 28 full DoD, demo + cloud, fa/en, 1280/390:**
  - **N1 demo:** canonical zero card → API uncategorize 12 → card «۱۲» → click → `#/library?cat=none` + «۱۲ مورد» + chip active → S6: select 10 → ONE batch → toast «۱۰ مورد دسته‌بندی شد» → card «۲» → categorize last 2 → zero card. EN pass («3 uncategorized items…» → 3 items at `cat=none`). Mobile 390 card fits.
  - **N1 cloud (emulator):** fresh sign-up → 2 uncategorized captures via UI → card «۲» (live-store count).
  - **N2 demo:** round-trip Export→Import → preview «۲۳ یادداشت · ۸ دسته · ۱۶ برچسب» → report «۰ اضافه، ۲۳ تکرار رد (۰ نامعتبر)» + total unchanged (21); modified file (+2 unique, +1 invalid) → «۲ اضافه، ۲۳ تکرار رد (۱ نامعتبر) — ۱ برچسب ساخته شد» → library search shows the 2; corrupt file → «این یک فایل JSON معتبر نیست»; no-marker → «این فایل، خروجی Savedbox نیست»; wrong-marker → «ساختار فایل با قالب خروجی Savedbox سازگار نیست»; totals unchanged after every rejection.
  - **N2 cloud (emulator):** same file on the fresh user → «۲۵ اضافه، ۰ تکرار (۱ نامعتبر) — ۸ دسته و ۱۷ برچسب ساخته شد» → realtime propagation WITHOUT refresh (library 25; inbox card ۷ = 2 capture + 3 file-demo + 2 file-test — exact).
  - **API probes:** invalid-json→400 `import.invalid-json`; wrong-marker→400 `import.invalid-schema`; 1001-note flood→400 (cap); direct import report shape exact (`notesAdded:1, notesSkippedDuplicates:1, tagsAdded:1`).
  - Page errors: 0; console errors: 0 (whole session).
- **Liveness checks (step 28):** `ls src/app/api/import/route.ts src/lib/domain/import-schema.ts src/server/services/import.ts` → all exist · `ls roadmaps/evidence/n1-*.png roadmaps/evidence/n2-*.png | wc -l` → **26** · `ls skills | grep -c '^ecc-'` → **11** · `ls skills/*/SKILL.md | wc -l` → **30** · rules-test 39/39 (same session) · dev.log: API 200s + Prisma queries + `✓ Compiled`.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must issue a fine-grained PAT (this repo, Contents: R/W). | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–4 + ECC layer + both roadmaps + wave-6 N1/N2) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed at least FOUR times by platform rollbacks (latest: found MISSING at the step-28 close-out push, 2026-11-07) and rebuilt each time** | **Rebuilt per the documented 1-command procedure at the v28 close-out** → pushed → parity EQUAL (LOCAL == REMOTE = `143b9ce…`, proven; re-runnable via §9 live check). Rebuild after any wipe: `git init --bare /home/z/my-project-backup.git && git push backup main` |
| Uploaded files (`db/uploads/`) | ⚠️ Runtime data, NOT in the repo (gitignored by design) | Demo uploads are user data at runtime | Fresh clone starts empty; previously uploaded attachments recoverable **only by re-uploading**. Cloud mode stores in Firebase Storage per-UID once that path goes live. |
| P3 cloud upload path | ⚠️ **Unverified** | No storage emulator in `firebase.json`; real Firebase project frozen | Owner-side Storage bucket + storage rules (Cloud-Go-Live backlog). Code shipped and honest-scoped. **N2 cloud import IS verified (Firestore), unlike P3 storage — do not conflate the two.** |
| `.env` Firebase placeholders | ⚠️ Gitignored runtime config (NOT in the repo — by design, no credentials policy) | The platform recycle emptied them mid-step-28; re-added per the documented contract | If wiped again: append the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` exactly as documented in §3 (values are demo identifiers, `project demo-savedbox`). A fresh environment recreates `.env` per §10 step 3. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; canonical sample via `POST /api/seed` (23/8/16). |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders only; production cloud persistence NOT verified (honest). |
| Emulator data (step-28 test user + imported docs) | ⚠️ Ephemeral emulator state (untracked) | Emulator suite is runtime-only | Recreate anytime (§7 documents the exact flows); not product data. |
| Dev server, emulator processes | ⚠️ Not persistent | Process state | `bun run dev`; `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–4, both roadmaps, the ECC layer, and wave-6 N1/N2) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential — with the explicit exception of `db/uploads/` attachments (re-upload to restore). Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v28 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | Clean of tracked modifications at close-out (the v28 docs commit is the last commit; gitignored runtime noise may appear — `.zscripts/dev.pid` is platform-managed) — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` shows `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea` (frozen); **push blocked (no credential)**; unchanged at v28 |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed + parity proven every step; **found MISSING (4th platform wipe) at the v28 close-out push → rebuilt per the documented procedure → pushed → parity EQUAL (LOCAL == REMOTE = `143b9ce…`; actual SHAs in worklog Step 28)** |
| Local HEAD at v28 | see `git rev-parse HEAD`. Chain: … v26 docs `aec5acf` → strategy roadmap `37a40b1` → v27 docs `b9a3e10` → **step-28 feature commit (`feat(n1,n2): visible inbox + json import (strategy wave 6)` — 12 src files + roadmap + 26 evidence pngs)** → **v28 snapshot/worklog docs commit (the live HEAD)** — 33+ commits ahead of frozen origin |
| Phase status | **Roadmap #1: Phases 1–4 ✅, Phase 5 (P1) FROZEN. Roadmap #2: wave 6 OPEN — N1 ✅ + N2 ✅ (both modes DoD-verified); N3 ⏳ owner order; waves 7–9 ⏳; G2 ⏸ owner decision.** |

**Liveness checks (step 28):**

```bash
ls src/app/api/import/route.ts src/lib/domain/import-schema.ts src/server/services/import.ts   # → all exist
ls roadmaps/evidence/n1-*.png roadmaps/evidence/n2-*.png | wc -l   # → 26
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

1. `git clone https://github.com/Sohrab1999/Savedmassagemanager1.git my-project` (public read; ⚠️ recovers only to `e5898b2` until owner pushes — then fully current). If a local `backup` mirror exists, prefer `git clone /home/z/my-project-backup.git` (fully current).
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (roadmap #1) → `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (roadmap #2) → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `AGENTS.md` → `docs/ECC-INSTALL.md` → `worklog.md`.
3. `bun install` · **create `.env`** (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` per §3/§8 — gitignored, not in the repo by design) · `bun run db:push`. `db/uploads/` starts empty (runtime data — §4 D-note).
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately (`POST /api/seed` → canonical 23/8/16); cloud mode needs the emulator (`bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`) or real Firebase env.
5. **ECC skills:** a current `backup` clone already contains `skills/ecc-*`. If missing (e.g. frozen-origin clone): re-clone ECC at commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b`, re-run the sweep + checksums per `docs/ECC-INSTALL.md`.
6. Resume from §1 "Next allowed step" / roadmap checkboxes (roadmap #1 phases 1–4 done; roadmap #2 wave 6: N1+N2 done, N3 awaits order; waves 7–9 + G2 ruling + P1 await the owner).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure.
2. **Full application build** (`be5caad`) + **Firebase integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → roadmap #1 (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1–QE7 + final regression.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7/S8/S1/S4/S3.
6. **Step 22 — G1 DONE:** realtime + offline + live-store reads; DoD live on emulator. SNAPSHOT v22.
7. **Step 23 — S5 DONE:** soft delete + trash + undo-rate KPI. SNAPSHOT v23.
8. **Step 24 — S2 DONE (Phase 3 closes):** shared tag chips + paste-link detection. SNAPSHOT v24.
9. **Step 25 — ECC workflow layer installed:** 11 skills + AGENTS.md + ECC-INSTALL.md; security sweep PASS; commit `9361459`; backup mirror rebuilt + parity. SNAPSHOT v25.
10. **Step 26 — PHASE 4 COMPLETE:** S6 bulk ops + QE typeahead + P3 real file upload; G2 NOT implemented (owner gate); DoD live; commit `f70834c`; demo DB re-seeded after sandbox recycle. SNAPSHOT v26.
11. **Step 27 — PRODUCT-STRATEGY ROADMAP REGISTERED (docs-only):** roadmap #2 (N1–N10, phases 6–9, Top-10, Opportunity Map, warnings, G2 decision package); commits `37a40b1` + `b9a3e10`; backup parity proven. SNAPSHOT v27.
12. **Step 28 — STRATEGY WAVE 6 OPENED: N1 + N2 COMPLETE (owner order):**
    - **Environment repairs first (platform recycle artifacts):** demo SQLite DB wiped (re-seeded canonically 23/8/16); `src/app/api/upload/route.ts` deleted + 30 files mode-changed in the working tree (restored from HEAD via `git checkout -- .` — zero content loss, verified); `.env` Firebase placeholders emptied (re-added per the documented gitignored contract, §3/§8).
    - **N1 visible Inbox:** `StatsDTO.uncategorized` both backends; dashboard Inbox card (count badge; explicit zero state) + library «بدون دسته» FilterChip; i18n fa/en; DoD live (demo + cloud): counter/list parity, one-click deep-link `#/library?cat=none`, S6 drain flow (12→10-batch→2→0), EN + 390 passes.
    - **N2 JSON import:** shared zod schema (both export shapes, marker gate, flood caps); demo transactional merge service + `POST /api/import` (causal 400s); cloud `repository.importData` (batchedSet ≤500 + batchedCreateTags); Settings two-step-guardrail import card + exact report toast; API probes; DoD live: round-trip 0-added/23-skipped with total unchanged; +2-new file report with invalid counted; corrupt/no-marker/wrong-marker causal toasts; **cloud pass: 25 added through real rules (39/39 re-run green) + realtime propagation without refresh**.
    - Quality: lint exit 0; tsc 0 under src/; page/console errors 0. Evidence 26 pngs (`n1-*`, `n2-*`). Demo DB re-seeded canonically at close-out (verification artifacts reset — expected demo runtime behavior). SNAPSHOT v28.

## 12. Remaining Work & Known State

- **Roadmap #2 wave 6 (IN PROGRESS — awaiting owner orders):** **N3 Persian search normalization + highlight is the remaining wave-6 item — NOT started (outside the step-28 owner order; the roadmap checkbox stays `[ ]`)**. Waves 7–9 (N4–N10), the **G2 ruling** (AI / rule-based / none → `docs/DECISIONS.md`), and roadmap #1's **Phase 5 P1 Telegram bridge (FROZEN)** all await explicit owner orders.
- **Cloud-Go-Live backlog:** P3 cloud upload verification (owner-side Storage bucket + storage rules — **distinct from N2 cloud import, which IS verified**); password-reset link (QE7, real Email provider); composite-index pruning at go-live review; optional server-side trash purge.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7); N3 order; waves 7–9 orders; G2 ruling; P1 order.
- **Honest note (a) — N2 cloud scope:** verified on the LOCAL Emulator Suite (Auth+Firestore) including rules-compliant batched writes and realtime propagation; the REAL Firebase project remains frozen — production cloud persistence still unverified until the owner supplies real env values (pre-existing limitation, unchanged by this step).
- **Honest note (b) — N2 export-shape acceptance:** the importer accepts BOTH the demo `/api/export` shape and the cloud Settings-export shape; note the cloud export currently lists only non-archived notes (pre-existing Settings behavior, unchanged) — a cloud export therefore cannot restore archived notes until the export path is revisited (recorded here so nobody claims import "loss" for data the export never contained).
- **Honest note (c) — demo-state recycle (step 28):** the platform recycle wiped the demo SQLite DB mid-step AND reverted working-tree files (deleted `upload/route.ts`, mode changes) AND emptied `.env` Firebase placeholders. All three were repaired (re-seed 23/8/16; `git checkout -- .`; env re-added) and the demo DB was re-seeded again at close-out to reset verification artifacts (API-probe note «پروب-API-درون‌ریزی» + the 2 test notes + uncategorization probes). Expected demo runtime behavior, not data loss.
- **Honest note (d) — toast timing:** two toasts expired between CLI round-trips during verification (agent-browser harness timing artifacts, NOT app bugs) — both re-captured on retry (foreign-marker toast; the 2-item categorize toast whose state change was API-proven `uncategorized:0`).
- **Lint (standing):** re-verified CLEAN at the step-28 close-out (exit 0). tsc noise: 3 pre-existing lines outside `src/` (unchanged).
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure".

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump v28 + date).
2. [x] Affected reference docs updated: `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (N1/N2 checkboxes + DoD evidence), `docs/ROADMAP.md` (strategy-wave execution status), `worklog.md`. Scope honesty: `docs/DECISIONS.md` unchanged (no new ruling — the step executed an existing owner order), `docs/CHANGELOG.md`/`docs/ENVIRONMENT.md` unchanged (no Brief delta; env contract text already documented).
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA (§9; SHAs in worklog Step 28).
4. [x] `git status` reviewed before commit — feature files + roadmap + 26 evidence pngs staged and verified exclusive; nothing essential left in temp locations (`tool-results/` gitignored; `/tmp` probe files are ephemeral and reproducible per §7).
5. [x] Commit with a descriptive message (two commits: feature, then docs).
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method (incl. the gitignored `.env` contract). Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer, Phase 4, both roadmaps and wave-6 N1/N2) today — except `db/uploads/` attachments and the gitignored `.env` (both documented with recovery methods above); true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
