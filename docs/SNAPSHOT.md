# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 29 · **Date:** 2026-11-07 · **Snapshot author:** Z.ai Code agent
> **v29 changelog:** **STEP 29 — N3 + N4 + N5 COMPLETE (owner order; wave 6 CLOSED, wave 7 half-done).** **N3 Persian search quality:** shared compare-only normalizer `src/lib/persian.ts` (`normalizePersian`: ي/ى/ئ→ی، ك→ک، أ/إ/آ/ٱ→ا، ۀ/ة→ه، ؤ→و، diacritics/tatweel/ZWNJ/ZWJ/BOM stripped, fa+ar digits→ASCII, lowercase — stored data NEVER rewritten); demo `listNotes` routes q-queries through an in-memory normalized filter over all 6 searchable fields (demo-scale tradeoff documented); cloud `matchesText` folds both sides over the G1 live array; NoteCard highlight — `highlightRegexFor()` equivalence-class regex over ORIGINAL text (query-side diacritics dropped, diacritics/ZWNJ allowed BETWEEN chars) + amber `<mark>` on title/snippet + search-focused snippet window when the hit lives in content. **N4 interactive dashboard:** stat cards with an equivalent filter are native `<button>`s with fa/en aria-labels — کل → `#/library`، علاقه‌مندی → `#/library?fav=1`، بایگانی → `#/library?arch=1` — each building a CLEAN view (`resetFilters()` first; the fav=1 stale-filter leak found in run 1 was fixed exactly this way); **DoD decision: «این هفته» stays display-only** (savedAfter=7d would add a new filter dimension to both backends for a marginal path); N1 inbox regression → `cat=none` intact. **N5 trash management:** `BulkNoteAction + "purge"` (zod enum; state-guard: only actually-trashed notes — live-note probe → `updated:0`), demo attachment cleanup (`isValidFileKey`-gated unlink under `db/uploads/`), new `DELETE /api/trash` (one SQL statement), cloud `repository.emptyTrash` + `batchedDelete` (≤500-op chunks, S8 family); shared `TRASH_RETENTION_MS` + `trashDaysLeft()` in domain types (realtime.ts reuses); UI — per-card «۷ روز تا پاک‌سازی»/«امروز پاک‌سازی می‌شود» chips (both layouts, replacing relative time), per-item purge icon (replaces the favorite star in trash) behind a CAUSAL AlertDialog naming the exact item, «خالی‌کردن سطل (N)» behind the MANDATORY two-step confirm (step-1 scope+irreversibility → «ادامه» with `preventDefault` so Radix stays open → step-2 «تأیید نهایی» → destructive accept), explicit «سطل خالی است» empty state; purge is NEVER wired into the S5 undo metric. **Verification (39/39 checks, `scripts/verify-n345.sh` runbook, browser+API, fa/en, 1280/390):** normalization matrix كتاب=کتاب=۲، يادداشت=یادداشت=۲، مُطالعه=مطالعه=۳، میروم→۱ (ZWNJ data)، EN «taking guide»→۱، URL «example.com»→۱; live `<mark>` evidence incl. a seed note with Persian kaf; deep-link hash proofs + no stale-filter leak both directions; purge → GET 404 + toast «۱ مورد برای همیشه حذف شد»; empty-trash → «سطل خالی شد — ۲ مورد…» + both GET 404 + idempotent `{deleted:0}`; undo-leak negative check; 0 console errors. Two REAL bugs found & fixed during verification: (1) `onPurge={setPurgeTarget}` fed the raw id string into a NoteDTO state slot → empty dialog name + 400 on confirm — fixed with `handlePurgeRequest(id)` resolving the note; (2) Radix `AlertDialogAction` auto-closes the dialog, breaking the two-step flow — fixed with `event.preventDefault()` on «ادامه». Lint exit 0; `tsc --noEmit` 0 errors under `src/`. 15 new evidence pngs (`n3-*`, `n4-*`, `n5-*`; 41 total). Sandbox findings recorded: the platform kills agent-spawned processes between tool calls (boot server died of OOM at ~1.9 GB RSS) → all server-dependent verification runs as the single-session runbook.
> **v28 changelog (historical):** STRATEGY WAVE 6 OPENED — N1 + N2 COMPLETE (step 28, owner order). N1 visible Inbox (`StatsDTO.uncategorized` both backends, dashboard card, «بدون دسته» FilterChip, S6 drain verified live) + N2 JSON import (shared zod schema, demo transactional merge, `POST /api/import`, cloud batched import, two-step guardrail UI, round-trip 100%).
> **v26 changelog (historical):** ROADMAP PHASE 4 COMPLETE — S6 bulk ops ✅ + QE-tagging typeahead ✅ + P3 real file upload ✅ (demo DoD live); G2 ⏸ owner gate; P3 cloud path honest-unverified → Cloud-Go-Live backlog.
> **v25 changelog (historical):** ECC workflow layer installed — 11 curated `skills/ecc-*` + `AGENTS.md` + `docs/ECC-INSTALL.md` (Manual Adaptation path; security sweep PASS; provenance commit `d2ef268`; force-added past the `/skills/` gitignore).

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Roadmap #1 | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. **Phases 1–4 COMPLETE; Phase 5 (P1 Telegram bridge) FROZEN.** |
| Roadmap #2 | **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** (2026-11-07) — "Next Value" wave: N1–N10 + G2 decision package, phases **6–9**. **Wave 6 CLOSED (N1 ✅ N2 ✅ N3 ✅). Wave 7: N4 ✅ + N5 ✅ (both step 29); N10 ⏳ owner order. Waves 8–9 + G2 ruling await the owner.** |
| **Current gate** | **Strategy wave 7 in progress (owner's step-29 order: N3 + N4 + N5 — all three executed, verified, persisted).** Remaining wave-7 item **N10 (duplicate detection on capture — now unblocked, N3 foundation in place) awaits an explicit owner order**; waves 8–9 and the G2 ruling likewise await the owner. After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`. Skills applied in step 29: `ecc-change-impact` (blast radius: 12 modified files + 2 new modules + 1 runbook; no schema/rules/deps), `ecc-security-review` mindset (destructive-ops threat model: state guards on purge/empty-trash, `isValidFileKey` gate before unlink, no user input into filesystem paths, irreversible-op confirmation ladders), `ecc-react-patterns` (React Compiler memoization contract — manual useMemo/useCallback removed where the compiler demands it), `ecc-verification-loop` (gates: lint/tsc/API matrix/39-check browser runbook/undo-leak negative test). |
| Development status | **Full application implemented and running** (see §2). **Roadmap #1 phases 1–4 COMPLETE; roadmap #2: wave 6 COMPLETE (N1+N2+N3), wave 7 N4+N5 COMPLETE, N10 pending owner order.** |
| Next allowed step | **Await owner orders only:** (a) N10 execution order (last wave-7 item; N3 foundation ready), (b) waves 8–9 picks (N6/N7/N8; N9 + G2 package), (c) the G2 ruling (AI / rule-based / none → recorded in `docs/DECISIONS.md`), (d) Phase 5 P1 Telegram bridge order (FROZEN). KPI status: Organize-Debt card zero-reachable (v28 ✓), Persian search normalization (v29 ✓), round-trip 100% (v28 ✓). Evidence: `n1-*`/`n2-*` (26) + `n3-*`/`n4-*`/`n5-*` (15). |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up (works against the LOCAL Emulator Suite), honest "continue in demo mode" entry, emulator badge, not-configured fallback.
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, N1 Inbox card, **4 stat cards — N4-interactive (below)**, category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: search (300 ms debounce) with **N3 normalized matching + live `<mark>` highlighting (below)**, filter toolbar (QE2) with type chips + favorite/N1 «بدون دسته» chip/archived/trash chips + category Select (incl. `none`) + tags popover; QE5 active-filters bar; S1 paginated results (30/page + Load more); S3 filters in the URL hash `#/library?q=…&type=…&cat=…&tags=…&fav=1&arch=1&sort=…&trash=1`; **S6 selection mode**; **N5 trash management (below)**.
  - **Categories**: category CRUD dialog + tags tab (create/filter/delete — no tag rename, gap noted in roadmap #2); QE3 clickable category cards.
  - **Settings**: profile, theme, language, JSON export, N2 JSON import card, demo-data reset (demo-only), environment/about (incl. undo-rate KPI).
- **N3 PERSIAN SEARCH QUALITY (v29, verified):**
  - **Core (compare-only):** `src/lib/persian.ts` — `normalizePersian()` folds Arabic-script variants to the Persian standard (ي/ى/ئ→ی، ك→ک، أ/إ/آ/ٱ→ا، ۀ/ة→ه، ؤ→و), strips diacritics (U+064B–065F, U+0670, U+06D6–06ED) + tatweel + ZWNJ/ZWJ/BOM, unifies fa/ar digits to ASCII, lower-cases. **Stored data is never rewritten** — both backends fold at comparison time only.
  - **Demo backend:** `listNotes` (src/server/services/notes.ts) — when `q` is present the SQL `contains` condition is dropped and the whole filter-scoped base set is filtered IN MEMORY through `normalizePersian` across title/content/description/url/fileName/sourceChat (demo-scale tradeoff: single-user SQLite; documented); JS sort mirrors the SQL orderBy so pagination semantics stay identical; the no-q path is unchanged Prisma.
  - **Cloud backend:** `repository.matchesText` folds both haystack and query with the same function (client-side filter over the live G1 array) — no read or write change.
  - **Highlight (NoteCard):** `highlightRegexFor()` builds an equivalence-class regex over ORIGINAL text (same folding table; query-side diacritics/ZWNJ dropped first — «مُطالعه» highlights «مطالعه»; diacritics/ZWNJ/tatweel allowed BETWEEN query chars so «کِتاب» matches «كتاب»); `splitHighlight()` yields `<mark>` segments (amber, dark-mode aware) on title AND snippet; `searchSnippetOf()` shows a window around the first content match when the primary snippet lacks it. No query → rendering unchanged.
- **N4 INTERACTIVE DASHBOARD (v29, verified):** StatCard renders a native `<button>` (hover/focus-visible, fa/en `aria-label`s: `a11y.stats.total/favorites/archived`) when an equivalent library filter exists — total → `resetFilters()+setView("library")` → `#/library`; favorites → `resetFilters()+setFilters({favorite:true})` → `#/library?fav=1`; archived → `#/library?arch=1`. **Each stat card builds a CLEAN view — stale filters never leak** (runbook asserts no fav↔arch leakage in both directions). **DoD decision (recorded): «این هفته» stays display-only** — a savedAfter=7d filter would add a new filter dimension to both backends for a marginal path. N1 inbox card regression-checked → `cat=none`.
- **N5 TRASH MANAGEMENT (v29, verified):**
  - **Backend:** `BulkNoteAction` gains `"purge"` (zod `bulkNoteActionSchema`; both services' state guards only touch notes with `deletedAt != null` — a purge request against a LIVE note returns `updated:0`, probed). Demo: one `deleteMany` + best-effort attachment unlink (`isValidFileKey`-gated, `db/uploads/` only). New route **`DELETE /api/trash`** (`src/app/api/trash/route.ts`) = empty trash in ONE SQL statement (+attachment cleanup). Cloud: `repository.emptyTrash()` + new `batchedDelete` helper (≤500-op committed chunks — S8 helper family); note tags are denormalized INSIDE the note doc so doc deletion removes every dependency. Tags/categories are never deleted by purge (independent records).
  - **Shared countdown:** `TRASH_RETENTION_MS` + `trashDaysLeft()` in `src/lib/domain/types.ts` (single source; `realtime.ts` imports/re-exports it; its client-side 7-day sweep unchanged).
  - **UI:** trash-view cards show «{n} روز تا پاک‌سازی» / «امروز پاک‌سازی می‌شود» chips (both layouts, replacing relative time); per-item purge icon (Trash2, replaces the favorite star in trash mode, stopPropagation) → CAUSAL AlertDialog naming the exact title; «خالی‌کردن سطل (N)» header button (visible when `filters.trash && total > 0`) → MANDATORY two-step confirm — step 1 (count + irreversibility) → «ادامه» (`event.preventDefault()` keeps the Radix dialog open — the auto-close broke the ladder in run 1) → step 2 («تأیید نهایی» → destructive «بله، سطل خالی شود»); explicit «سطل خالی است» empty state; **purge/empty-trash toasts carry NO undo action and never touch the S5 undo-rate metric**.
- **N1 VISIBLE INBOX (v28):** `StatsDTO.uncategorized` (demo COUNT + cloud live-array count — exactly the `cat=none` view), dashboard Inbox card (count badge → `#/library?cat=none`, explicit zero state with aria-live), visible «بدون دسته» FilterChip; S6 synergy proven live (v28).
- **N2 JSON IMPORT (v28):** shared zod schema `src/lib/domain/import-schema.ts` (accepts BOTH export shapes via `app:"savedbox"`/`source:"firestore"` marker; anti-flood caps 1000 notes/200 cats/500 tags/20 MB body/15 MB file), demo service `src/server/services/import.ts` (ONE Prisma transaction; category=slug, tag=name, duplicate=exact type+title+url; NEVER deletes/updates), `POST /api/import` (causal 400s), cloud `repository.importData` (batchedSet ≤500-op chunks + batchedCreateTags — S8), Settings import card with the mandatory two-step guardrail + exact merge report toast. Round-trip = 100% (v28 DoD).
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types, title/content/url/mediaUrl, category, shared tag chips; QE6 error-prevention save flow; S2 paste-link detection; **P3 real file upload for file/image type** (demo verified; cloud path honest-unverified → Cloud-Go-Live backlog).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing, S4 title/content editing, tags via the shared S2 chips component (with QE typeahead), favorite/archive/delete (confirm), restore-from-trash, open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, **N3 `<mark>` highlighting + search-focused snippet**, category chip, QE1 list rows, QE4 shared TagChips (max 2 + +N), S6 per-card `SelectToggle`, **N5 trash mode (countdown chip + purge button replacing the star)**.
- **S6 BULK OPERATIONS (v26):** `POST /api/notes/bulk` (zod ≤500 ids, **actions now include `purge`**) + `bulkUpdateNotes` — demo = ONE Prisma statement per action with state guards; cloud = ONE committed writeBatch per ≤500 chunk. UI: selection mode, per-card checkboxes, fixed action bar, trash restore-only, 7-second batch-undo toast.
- **QE-TAGGING TYPEAHEAD (v26):** `tag-chips-input.tsx` filtered dropdown (startsWith→contains, `noteCount` ranking, ≤6, keyboard nav, ARIA). Both capture paths.
- **P3 REAL FILE UPLOAD (v26; demo verified, cloud honest-unverified):** `src/server/storage.ts` (10 MB, extension allowlist, UUID keys under gitignored `db/uploads/`) + `POST /api/upload` + `GET /api/files/[key]`. **v29: purged notes unlink their demo upload files (`isValidFileKey`-gated).**
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API over Prisma/SQLite. **v29 addition: `emptyTrash` dispatch (cloud = repository, demo = DELETE /api/trash).**
- **G1 REALTIME + OFFLINE (v22, Cloud mode):** `persistentLocalCache` + multi-tab manager; `realtimeStore` with 3 uncapped `onSnapshot` listeners per UID; repository reads derive from the live store; realtime bridge in app-shell (coalesced invalidations); demo polls 2 s.
- **S5 UNDO DELETE (v23):** soft delete + restore + trash view + 7-day purge + undo-rate KPI. **v29 adds explicit purge/empty-trash on top — undo semantics untouched.** S2 capture unification (v24) and S7→S8→S1→S4→S3 (Phase 2) remain in force under G1.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (owner-only + field validation; UNCHANGED since the 39/39 pass), `firestore.indexes.json`, `scripts/rules-test.ts` (39/39), `scripts/e2e-verify.sh` (Firebase-phase E2E) and **`scripts/verify-n345.sh` (NEW v29 — single-session verification runbook for N3/N4/N5: boots the dev server, seeds, creates the test corpus, runs the 39-check browser+API matrix, writes the evidence pngs; committed as a reproducible verification artifact, NOT product test code)**.
- **i18n/RTL**: type-safe flat dictionaries fa+en (`src/lib/i18n/dictionaries.ts` — fa default; **v29: N4 a11y + 19 N5 trash keys in both**), `dir` synced, Persian digits, Vazirmatn.
- **Platform compliance**: single user-visible route `/`; API routes under `src/app/api/**`; sticky-footer rules; shadcn/ui New York only.
- **ECC workflow layer (agent tooling — step 25, commit `9361459`):** 11 curated skills under `skills/ecc-*`, `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`. Activation via the harness Skill tool — advisory process, no runtime enforcement.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route: `/`. API routes (`src/app/api/**`), not server actions.
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore`; demo list server-paginated (30/page) with 2 s polling.**
- **N3 search contract (v29):** `normalizePersian` (src/lib/persian.ts) is the SINGLE folding source for matching on both backends — demo folds in the service layer (in-memory path when `q` present; base set = all other filters, unbounded fetch, demo-scale), cloud folds inside `matchesText` over the live array. Stored data is NEVER rewritten. The NoteCard highlight regex MUST stay derived from the same equivalence table (`EQUIVALENCE_CLASSES` + `BETWEEN`) — if the folding table changes, both change together. English/URL search remains plain case-insensitive includes on folded text (regression matrix in §7).
- **N4 dashboard contract (v29):** stat cards with an equivalent filter are native buttons; the click MUST build a clean view (`resetFilters()` → set its one filter → `setView("library")`); «این هفته» intentionally display-only (recorded DoD decision).
- **N5 trash contract (v29):** `action:"purge"` and `DELETE /api/trash` are permanent deletes guarded to `deletedAt != null` records only (server-side, both backends); demo attachment cleanup unlinks ONLY `db/uploads/<uuid>.<allowlisted-ext>` keys validated by `isValidFileKey` (never user-supplied paths); cloud purge = `batchedDelete` chunks ≤500 ops; **purge/empty-trash never enter the S5 undo metric or its toasts**; `TRASH_RETENTION_MS` has exactly one definition (domain types).
- **N1 contract (v28):** `StatsDTO.uncategorized` = live + non-archived + `categoryId null` — MUST stay identical to the library `cat=none` filter semantics on both backends.
- **N2 import contract (v28):** `POST /api/import` (demo) / `repository.importData` (cloud) — input = a Savedbox export payload (marker `app:"savedbox"` OR `source:"firestore"`; zod-validated in `src/lib/domain/import-schema.ts` — the SINGLE validation source for both backends); caps: ≤1000 notes / ≤200 categories / ≤500 tags / 20 MB server body / 15 MB client file; merge semantics: create-only (never update/delete), duplicate = exact `type|title|url`, category remap = payload categoryId → payload slug → server slug map, tag remap by name, invalid items skipped + counted; output = `ImportReport`. Cloud writes = committed writeBatches ≤500 ops (`batchedSet`).
- **S6 bulk contract (v26, v29-extended):** `POST /api/notes/bulk` — `{ids[1..500], action: categorize|archive|unarchive|delete|restore|purge, categoryId?}` → `{ok, updated}`; cloud = one committed writeBatch/deleteBatch per ≤500 chunk.
- **P3 upload contract (v26):** `POST /api/upload` multipart (10 MB, extension allowlist) → `{url, fileName, fileSize}`; `GET /api/files/[key]` regex-validated + nosniff + immutable. Cloud Storage path unverified (backlog).
- **Sandbox process contract (v29, operational):** the platform reaps agent-spawned processes between tool calls and the boot dev server dies of OOM (~4 GB cgroup; next-server killed at ~1.9 GB RSS after long accumulation). Consequence: server-dependent verification MUST run inside a single tool call via the committed runbook (`scripts/verify-n345.sh` pattern: pkill → `setsid nohup bun run dev` → wait-for-200 → browser+API → done).
- **Firebase Emulator Suite (in-sandbox, cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). **`.env` (gitignored runtime config) carries emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true`** — values are demo identifiers, never real credentials. No storage emulator configured (P3 cloud path has no local target).
- **State:** Zustand (view/detailNoteId/captureOpen/filters/bulkSelectMode) + TanStack Query (UID-scoped keys; invalidations from mutations AND the realtime bridge).
- **React Compiler note (v29):** `bun run lint` enforces `react-hooks/preserve-manual-memoization` — inside components, prefer plain derivations (the compiler memoizes) over manual `useMemo`/`useCallback` whose deps it cannot prove; module-level helper functions are the escape hatch.
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa` (`src/lib/i18n/dictionaries.ts`); `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e/verify-n345 are verification scripts run on demand.
- **Agent tooling contract (ECC):** skills = markdown guidance via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` = advisory workflow layer. Upgrade procedure per `AGENTS.md`/`docs/ECC-INSTALL.md`.
- **Step-29 note:** N3/N4/N5 kept the G1 architecture — no new listeners, no schema change, no rules change, no new dependencies. N3 demo search trades SQL contains for an in-memory fold (scoped honestly to demo scale); N5 cloud purge/delete reuse the S8 batch helpers.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست».
- **Step-28 owner order:** N1 + N2 (executed, v28). **Step-29 owner order (verbatim key points):** «N3 — کیفیت جست‌وجوی فارسی (نرمال‌سازی نویسه + هایلایت) …» (normalize ی/ي، ک/ك، اعراب، نیم‌فاصله — compare-only; highlight in NoteCard snippet; demo=service-layer fold, Cloud=client-side filter on the live G1 array; manual test matrix per the no-test-code rule) + «N4 — داشبورد تعاملی (deep-link آمار) …» (fav→`#/library?fav=1`، arch→`arch=1`، کل→کتابخانه; «این هفته» decision at execution, record in DoD) + «N5 — مدیریت سطل (خالی‌کردن، حذف قطعی تکی، شمارش معکوس پاک‌سازی) …» (7-day countdown, two-step empty-trash, causal single purge, dependency cleanup both modes, S8 fan-out pattern) — i.e. the owner picked three more items from roadmap #2: wave 6 closed, wave 7 half-done. N10 and everything else remains un-ordered. The G2 ruling is still pending.
- **Import merge policy (v28, binding):** create-only merge, no automatic deletion/overwrite.
- **N5 irreversible-ops policy (v29, binding, from the ordered card):** permanent deletes REQUIRE causal confirmation (single purge names the item; empty-trash uses the two-step ladder); purge never enters undo metrics; state guards prevent purging live notes.
- **N4 «این هفته» decision (v29, recorded per the ordered card):** display-only — no savedAfter filter dimension added.
- **D-note (step 26, still true):** uploaded files live OUTSIDE the repo (`db/uploads/` gitignored) — runtime data, recoverable only by re-uploading (§8/§10/§12). **v29 addition: purged notes unlink their demo upload files server-side.**

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO`, `CategoryDTO`, `TagDTO` (noteCount), `StatsDTO` (+ `uncategorized`), `ProfileDTO`, `NoteFilters` (+ trash, pageToken/pageSize), `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`, `BulkNotesInput`/`BulkNotesResponse` (**v29: action union + `"purge"`**), **`EmptyTrashResponse {ok, deleted}` (v29)**, **`TRASH_RETENTION_MS` + `trashDaysLeft()` (v29)**, `ImportReport`, `UploadedFileInfo`.
- **Search utilities (v29):** `src/lib/persian.ts` — `normalizePersian()`, `EQUIVALENCE_CLASSES`, `BETWEEN`, `highlightRegexFor()`, `splitHighlight()` (+ `HighlightSegment`), `firstMatchIndex()`. Dependency-free (client + server).
- **Import validation schemas (v28):** `src/lib/domain/import-schema.ts` — shared by the demo route AND the cloud repository (single validation source).
- **Schema honesty: NO database schema change in v29 or v28** (no Prisma migration, no Firestore rules/indexes change). Purge reuses the existing models; NoteTag cascade (`onDelete: Cascade`) + category SetNull are pre-existing.
- **Demo mode:** Prisma/SQLite (`prisma/schema.prisma` — Note/Category/Tag/NoteTag/Profile), canonical seed 23 notes / 8 categories / 16 tags via `POST /api/seed` (re-seeded at the step-29 close-out; see §12).
- **Cloud mode:** Firestore docs per `src/domain/types.ts` under `users/{uid}/…`; rules whitelist unchanged; purge/empty-trash = batched `deleteDoc`s.
- **S5 semantics:** `deletedAt = null` → normal views; non-null → trash only; hard delete after 7 days (lazy sweep demo / client sweep cloud) **+ explicit purge/empty-trash (v29)**. API list param `trash=true` (UI hash `trash=1` maps to it).
- **Upload storage (demo):** `db/uploads/<uuid>.<allowlisted-ext>` — gitignored runtime data; unlinked when its note is purged (v29).

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), firebase ^11 (auth + firestore + storage), zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner, lucide-react, zod, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`. **Steps 25–29 added ZERO runtime dependencies.**

## 7. Tests & Quality Status

- **Owner rule: no test code.** Verification scripts are runbooks run on demand: `scripts/rules-test.ts` (**39/39 PASS, re-run at step 28**), `scripts/e2e-verify.sh` (Firebase-phase E2E), **`scripts/verify-n345.sh` (NEW v29 — 39 checks, single session)**.
- **Lint:** `bun run lint` **CLEAN — exit 0 at the step-29 close-out** (after removing the two manual-memoization blocks the React Compiler rejected).
- **Type check:** `bunx tsc --noEmit` — **0 errors under `src/` at the step-29 close-out** (pre-existing noise only in `examples/` + `skills/image-edit`). This caught the type-safety net dev-mode misses; keep it in the gates.
- **Browser verification (mandatory per UI step) — step 29 full DoD via `scripts/verify-n345.sh` (39/39 PASS, fa/en, 1280/390, console errors 0):**
  - **N3 API matrix:** `كتاب`(arabic kaf)=`کتاب`=2 · `يادداشت`=`یادداشت`=2 · `مُطالعه`(damma)=`مطالعه`=3 · `میروم`→1 (matches ZWNJ data «می‌روم») · EN `taking guide`→1 · URL `example.com`→1 (regression green).
  - **N3 UI:** Arabic-kaf query in the browser finds the Persian-kaf seed note AND the test note, both with amber `<mark>` highlight («۲ مورد», clean filter state); diacritic query highlights; ZWNJ-free query matches ZWNJ data; EN locale regression. Evidence: `n3-search-arabic-kaf-fa-1280.png` (both cards marked), `n3-search-diacritic-fa-1280.png`, `n3-search-zwnj-fa-1280.png`, `n3-search-en-1280.png`, `n3-library-mobile-390.png` (true 390×844).
  - **N4:** «این هفته» STATIC (DoD decision); favorites/archived/total cards are native `<button>`s with localized aria-labels; hash proofs `#/library?fav=1` / `#/library?arch=1` / `#/library`; **no stale-filter leakage in either direction** (favorites link carries no arch and vice versa — this was a real defect in run 1, fixed by `resetFilters()` first); N1 inbox regression → `cat=none`. Evidence: `n4-dashboard-fa-1280.png`, `n4-fav-deeplink-fa-1280.png`, `n4-arch-deeplink-fa-1280.png`, `n4-en-1280.png`.
  - **N5:** countdown chips «۷ روز تا پاک‌سازی» on all trashed cards; «خالی‌کردن سطل (۳)» button; purge dialog names the exact item («لیست خرید»); purge toast «۱ مورد برای همیشه حذف شد» + GET → 404; **undo-leak negative check** (toast contains no بازگردانی action); empty-trash step 1 («بازگشت‌ناپذیر») → step 2 («تأیید نهایی») → «سطل خالی شد — ۲ مورد برای همیشه حذف شد» → both GET → 404 → explicit «سطل خالی است» state → idempotent re-run `{ok:true,deleted:0}`; live-note purge guard → `updated:0`. Evidence: `n5-trash-countdown-fa-1280.png`, `n5-purge-confirm-fa-1280.png`, `n5-purge-toast-fa-1280.png`, `n5-empty-step1-fa-1280.png`, `n5-empty-step2-fa-1280.png`, `n5-trash-empty-state-fa-1280.png`.
  - **Demo DB state after the runbook:** canonical seed re-applied at start, then 7 test notes created (4 remain live: کتاب مدیریت زمان، یادداشت جلسهٔ هفتگی، مطالعهٔ شبانه، Note Taking Guide; the 3 trashed probes were purged/emptied through the UI flows being tested). `POST /api/seed` at the step-29 close-out restored the canonical 23/8/16 (see §12).
- **Liveness checks (step 29):** `ls src/lib/persian.ts src/app/api/trash/route.ts scripts/verify-n345.sh` → all exist · `ls roadmaps/evidence/n3-*.png roadmaps/evidence/n4-*.png roadmaps/evidence/n5-*.png | wc -l` → **15** (41 total evidence pngs) · `ls skills | grep -c '^ecc-'` → **11** · rules-test 39/39 (unchanged rules; last green run step 28) · dev.log: API 200s + `✓ Ready`.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must issue a fine-grained PAT (this repo, Contents: R/W). | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–4 + ECC layer + both roadmaps + waves 6–7 progress) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed FOUR times by platform rollbacks (latest found MISSING at the step-28 close-out push) and rebuilt each time** | **Rebuilt per the documented 1-command procedure whenever missing** → pushed → parity EQUAL (proven every step; exact SHAs in worklog Step 29). Rebuild after any wipe: `git init --bare /home/z/my-project-backup.git && git push backup main` |
| Uploaded files (`db/uploads/`) | ⚠️ Runtime data, NOT in the repo (gitignored by design) | Demo uploads are user data at runtime | Fresh clone starts empty; previously uploaded attachments recoverable **only by re-uploading**. **v29: purged notes delete their demo files server-side — purged attachments are gone by design.** Cloud mode stores in Firebase Storage per-UID once that path goes live. |
| P3 cloud upload path | ⚠️ **Unverified** | No storage emulator in `firebase.json`; real Firebase project frozen | Owner-side Storage bucket + storage rules (Cloud-Go-Live backlog). **v29 note: cloud purge deletes note docs but NOT Storage objects — orphaned objects possible until the backlog lands (honest limitation, recorded in §12).** |
| `.env` Firebase placeholders | ⚠️ Gitignored runtime config (NOT in the repo — by design, no credentials policy) | The platform recycle emptied them mid-step-28; re-added per the documented contract | If wiped again: append the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` exactly as documented in §3 (values are demo identifiers, `project demo-savedbox`). A fresh environment recreates `.env` per §10 step 3. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; canonical sample via `POST /api/seed` (23/8/16). |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders only; production cloud persistence NOT verified (honest). |
| Emulator data (test users + imported docs) | ⚠️ Ephemeral emulator state (untracked) | Emulator suite is runtime-only | Recreate anytime (§7 documents the exact flows); not product data. |
| Dev server, emulator processes | ⚠️ Not persistent + **platform reaps agent-spawned processes between tool calls; boot server died of OOM (~1.9 GB next-server RSS vs ~4 GB cgroup)** | Process state | `bun run dev`; `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`. Server-dependent verification runs as a single-session runbook (`scripts/verify-n345.sh`). |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–4, both roadmaps, the ECC layer, and waves 6–7 N1–N5) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential — with the explicit exception of `db/uploads/` attachments (re-upload to restore) and the gitignored `.env` (documented recovery). Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v29 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | Clean of tracked modifications at close-out (the v29 docs commit is the last commit; gitignored runtime noise may appear) — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` shows `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea` (frozen); **push blocked (no credential)**; unchanged at v29 |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed + parity proven every step (4th wipe history in §8) |
| Local HEAD at v29 | see `git rev-parse HEAD`. Chain: … v28 docs `143b9ce` → v28 ledger amendment `04fdd66` → **step-29 feature commit (`feat(n3,n4,n5): persian search normalization + highlight, interactive dashboard, trash management`)** → **v29 snapshot/worklog docs commit (the live HEAD)** — 35+ commits ahead of frozen origin |
| Phase status | **Roadmap #1: Phases 1–4 ✅, Phase 5 (P1) FROZEN. Roadmap #2: wave 6 COMPLETE (N1+N2+N3 ✅), wave 7 N4+N5 ✅ / N10 ⏳ owner order; waves 8–9 ⏳; G2 ⏸ owner decision.** |

**Liveness checks (step 29):**

```bash
ls src/lib/persian.ts src/app/api/trash/route.ts scripts/verify-n345.sh   # → all exist
ls roadmaps/evidence/n3-*.png roadmaps/evidence/n4-*.png roadmaps/evidence/n5-*.png | wc -l   # → 15
ls roadmaps/evidence/n1-*.png roadmaps/evidence/n2-*.png | wc -l          # → 26
ls skills | grep -c '^ecc-'             # → 11
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
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (roadmap #1) → `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (roadmap #2 — §7 checkboxes carry the per-item DoD evidence) → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `AGENTS.md` → `docs/ECC-INSTALL.md` → `worklog.md`.
3. `bun install` · **create `.env`** (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` per §3/§8 — gitignored, not in the repo by design) · `bun run db:push`. `db/uploads/` starts empty (runtime data — §4 D-note).
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately (`POST /api/seed` → canonical 23/8/16); cloud mode needs the emulator (`bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`) or real Firebase env.
5. **ECC skills:** a current `backup` clone already contains `skills/ecc-*`. If missing (e.g. frozen-origin clone): re-clone ECC at commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b`, re-run the sweep + checksums per `docs/ECC-INSTALL.md`.
6. **Verification runbook (v29):** `scripts/verify-n345.sh` reproduces the whole 39-check N3/N4/N5 verification in one session (server + seed + corpus + browser matrix + evidence pngs). Remember the sandbox process contract (§3): run it inside ONE tool call; do not expect a background dev server to survive tool-call boundaries.
7. Resume from §1 "Next allowed step" / roadmap checkboxes (roadmap #1 phases 1–4 done; roadmap #2 wave 6 closed, wave 7: N4+N5 done, **N10 awaits owner order**; waves 8–9 + G2 ruling + P1 await the owner).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure.
2. **Full application build** (`be5caad`) + **Firebase integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → roadmap #1 (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1–QE7 + final regression.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7/S8/S1/S4/S3.
6. **Step 22 — G1 DONE:** realtime + offline + live-store reads. SNAPSHOT v22.
7. **Step 23 — S5 DONE:** soft delete + trash + undo-rate KPI. SNAPSHOT v23.
8. **Step 24 — S2 DONE (Phase 3 closes):** shared tag chips + paste-link detection. SNAPSHOT v24.
9. **Step 25 — ECC workflow layer installed.** SNAPSHOT v25.
10. **Step 26 — PHASE 4 COMPLETE:** S6 bulk ops + QE typeahead + P3 real file upload; G2 NOT implemented (owner gate). SNAPSHOT v26.
11. **Step 27 — PRODUCT-STRATEGY ROADMAP REGISTERED (docs-only).** SNAPSHOT v27.
12. **Step 28 — WAVE 6 OPENED: N1 + N2 COMPLETE** (owner order): visible Inbox both backends + JSON import with two-step guardrails; round-trip 100%; cloud pass on the emulator (rules 39/39); environment repairs after a platform recycle. Commits `dfa816a` + `143b9ce` (+ `04fdd66` ledger amendment). SNAPSHOT v28.
13. **Step 29 — N3 + N4 + N5 COMPLETE (owner order; wave 6 CLOSED, wave 7 half-done):**
    - **N3:** shared `src/lib/persian.ts` compare-only normalizer; demo in-memory normalized search path; cloud folded `matchesText`; NoteCard equivalence-regex `<mark>` highlighting + search-focused snippet; EN/URL regression matrix green.
    - **N4:** stat cards → native buttons with clean-view deep-links (`#/library`, `#/library?fav=1`, `#/library?arch=1`); «این هفته» display-only decision recorded; stale-filter leak found & fixed.
    - **N5:** `purge` bulk action + `DELETE /api/trash` (both backends, state-guarded, S8 chunks); shared `TRASH_RETENTION_MS`/`trashDaysLeft`; countdown chips, causal single-purge dialog, mandatory two-step empty-trash, explicit empty state; purge never enters undo metrics; demo attachment cleanup gated by `isValidFileKey`.
    - Two real bugs caught by the verification runbook and fixed: the `onPurge` contract mismatch (id-string into a NoteDTO state slot) and the Radix `AlertDialogAction` auto-close breaking the two-step ladder.
    - Quality: lint exit 0; tsc 0 under `src/`; 39/39 runbook checks; 15 evidence pngs; console errors 0. Demo DB re-seeded canonically at close-out. SNAPSHOT v29.

## 12. Remaining Work & Known State

- **Roadmap #2 wave 7 (IN PROGRESS — awaiting owner orders):** **N10 (duplicate detection on capture) is the remaining wave-7 item — NOT started (outside the step-29 owner order; checkbox stays `[ ]`)**. Its N3 dependency (normalized comparison) is now in place. Waves 8–9 (N6/N7/N8; N9 + G2 package), the **G2 ruling**, and roadmap #1's **Phase 5 P1 Telegram bridge (FROZEN)** all await explicit owner orders.
- **Cloud-Go-Live backlog:** P3 cloud upload verification; **cloud purge/empty-trash do not delete Firebase Storage objects (v29 honest limitation — add object cleanup or accept orphans at go-live review)**; password-reset link (QE7); composite-index pruning; optional server-side trash purge.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7); N10 order; waves 8–9 orders; G2 ruling; P1 order.
- **Honest note (a) — N3 demo search scope:** the in-memory fold fetches the whole filter-scoped base set on every q-query — correct and fast at demo scale (single-user SQLite), but a production-scale deployment would want a normalized column or FTS index (recorded here so nobody claims silent loss; cloud mode filters the already-live array, unaffected).
- **Honest note (b) — N5 attachment cleanup scope:** demo purge unlinks local files (verified); cloud purge deletes note docs only — Storage objects remain (orphaned) until the Cloud-Go-Live backlog lands. No data the export/import round-trip covers is affected.
- **Honest note (c) — highlight is display-layer only:** the `<mark>` regex derives from the same equivalence table but is NOT the matching predicate (matching = `normalizePersian().includes()`). Practically aligned (verified live); if the folding table changes, update BOTH (contract §3).
- **Honest note (d) — N5 cloud path scoping:** purge/empty-trash cloud implementations follow the S8 batch contract but were NOT browser-verified on the emulator this step (demo-mode verification per the runbook; no new rules surfaces are involved — the writes are plain `deleteDoc`s already covered by the rules' allow-owner-delete). Same honest scoping convention as previous steps.
- **Honest note (e) — sandbox process behavior (step 29 discovery):** the platform reaps agent-spawned background processes between tool calls; the boot dev server died of OOM (next-server ~1.9 GB RSS). All verification therefore runs single-session via the committed runbook. This is environment behavior, not a product defect.
- **Lint (standing):** re-verified CLEAN at the step-29 close-out (exit 0). tsc noise: 3 pre-existing lines outside `src/` (unchanged).
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure".

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05 and re-issued verbatim with every step order (latest: step 29): after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump v29 + date).
2. [x] Affected reference docs updated: `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (N3/N4/N5 checkboxes + DoD evidence + §8 persistence state), `docs/ROADMAP.md` (strategy-wave execution status), `worklog.md`. Scope honesty: `docs/DECISIONS.md` unchanged (no new ruling — the step executed an existing owner order; the N5 irreversible-ops policy and the N4 «این هفته» decision are implementation decisions recorded in §4, not owner rulings), `docs/CHANGELOG.md`/`docs/ENVIRONMENT.md` unchanged (no Brief delta; env contract text already documented).
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA (§9; SHAs in worklog Step 29).
4. [x] `git status` reviewed before commit — feature files + runbook + roadmap + 15 evidence pngs staged and verified exclusive; nothing essential left in temp locations (`tool-results/` gitignored; `/tmp` probe files ephemeral and reproducible per §7).
5. [x] Commit with a descriptive message (two commits: feature, then docs).
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method (incl. the gitignored `.env` contract). Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer, Phase 4, both roadmaps and waves 6–7 N1–N5) today — except `db/uploads/` attachments and the gitignored `.env` (both documented with recovery methods above); true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
