# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 31 · **Date:** 2026-11-08 · **Snapshot author:** Z.ai Code agent
> **v31 changelog:** **STEP 31 — N10 COMPLETE (owner order; wave-7 closure) + the N9 phase-9 arbitration recorded (owner re-issued the N9 card verbatim with its own arbitration «فاز بعد (۹) — نیازمند زیرساخت و بررسی امنیتی؛ نه MVP» — an arbitration, NOT an implementation order; zero N9 code).** **N10 capture-time duplicate detection (soft, non-blocking, NO AI):** pure matcher `src/lib/duplicate.ts` — `normalizeUrlForCompare()` with the DOCUMENTED canonical form (scheme kept; host lower-cased; one `www.` dropped; trailing slashes + hash dropped; tracking params utm_*/fbclid/gclid/igshid/ref_src/ref_url/si stripped; remaining query pairs sorted) + `findDuplicate()` (canonicalized-URL equality preferred over title; title = N3-folded EXACT equality — Arabic ی/ى/ئ/ك fold so the owner's false-negative DoD holds while stored data is NEVER rewritten; trashed candidates EXCLUDED (recorded decision: a deleted item is not library pollution); archived INCLUDED; several matches → newest savedAt wins) — the SINGLE matching source for both backends; demo `GET /api/notes/duplicate` (STATIC segment — Next.js matches it before the sibling `[id]` route; 400 `duplicate.no-input` on empty input) + service `findDuplicateNote`; cloud `repository.findDuplicateNote` over the G1 live non-trashed array (zero extra reads); QuickCapture amber banner (`role="status"`, 400 ms debounce on url/title, category-name variant + uncategorized variant + honest hint «ثبت دوباره همچنان آزاد است») + «مشاهده» → closes capture, opens THAT note's sheet; **the save button is NEVER disabled by the result — proven live by a successful save with the banner visible**; shared types `DuplicateMatchOn/DuplicateCheckInput/DuplicateCheckResponse` in `lib/domain/types.ts`; `useDuplicateCheck` hook with **`staleTime:0 + gcTime:0` — a REAL BUG caught and fixed during verification: re-opening the dialog with a previously-checked URL briefly re-served the stale cached match (pre-save state) before the refetch landed; gcTime 0 makes every check fetch fresh**. Verification: **`scripts/verify-n10.sh` — 23/23 PASS, console 0** (API matrix 12: canonicalization ×3, negative, exact title, Arabic-yeh fold, 400, trashed→no-match, restore→match; UI 11: banner with «آموزش», مشاهده button, save-enabled-with-banner, second-copy save + newest-wins proof, no-category variant, مشاهده→sheet swap, unique→silent, EN, 390px). 4 new evidence pngs (`n10-*`; evidence dir = **125 pngs total — the v30 "46 total" note was a miscount, corrected here to the reproducible `ls | wc -l` truth**). Lint exit 0; `tsc --noEmit` 0 errors under `src/`. i18n scan: **293 keys per locale, 0 duplicates, en≡fa parity exact** (v30 recorded "296" on a different counting basis — the reproducible scan is authoritative). Roadmap #2: N10 checkbox → `[x]`, §7 phase-9 N9 item now carries the binding owner-arbitration note, §8 → step-31 state; `docs/ROADMAP.md` execution status → step 31. Demo DB re-seeded canonically at close-out.
> **v30 changelog (historical):** STEP 30 — N6 (related notes: `lib/related.ts` scorer tag×3/cat×2/type×1, real-connection gate, ≤3, honest «بدون AI»; demo `GET /api/notes/[id]/related`; cloud live-array join; sheet section renders ONLY on genuine connections) + N7 (resurfacing v1: recorded DoD decision — oldest-first, NO `lastOpenedAt`, NO schema change; demo `GET /api/resurface`; cloud live-array; ONE dashboard card + «یکی دیگر»; persistent per-device toggle; micro-event KPI; zero external notifications) + N8 (installable PWA: manifest route, AI-generated + PIL icon set incl. maskable, minimal network-first versioned SW + safe registration, layout metadata; iOS constraints documented; Lighthouse not available in sandbox — mechanical preconditions verified live) — 36/36 runbook (`scripts/verify-n678.sh`); 5th platform recycle repaired FIRST (re-hashed amendment commit + deleted upload route + wiped mirror → route restored, repair commit, mirror rebuilt, parity proven).
> **v29 changelog (historical):** STEP 29 — N3 (Persian search normalization + highlight: `src/lib/persian.ts` compare-only folding, demo in-memory search, cloud folded matchesText, NoteCard equivalence-regex `<mark>`) + N4 (interactive stat cards → clean deep-links `#/library`, `fav=1`, `arch=1`; «این هفته» display-only decision) + N5 (purge action + `DELETE /api/trash` both backends with state guards + S8 chunks; countdown chips, causal single-purge dialog, mandatory two-step empty-trash, explicit empty state; purge never enters undo metrics) — 39/39 runbook checks; two real bugs fixed (onPurge contract mismatch, Radix auto-close breaking the two-step ladder).
> **v28 changelog (historical):** STRATEGY WAVE 6 OPENED — N1 + N2 COMPLETE (visible Inbox both backends + JSON import with two-step guardrails; round-trip 100%; cloud pass on the emulator, rules 39/39).

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Roadmap #1 | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. **Phases 1–4 COMPLETE; Phase 5 (P1 Telegram bridge) FROZEN.** |
| Roadmap #2 | **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** (2026-11-07) — "Next Value" wave: N1–N10 + G2 decision package, phases **6–9**. **Wave 6 CLOSED (N1+N2+N3 ✅). Wave 7 CLOSED (N4+N5+N10 ✅ — N10 done step 31). Phase 8 CLOSED (N6+N7+N8 ✅). Phase 9 (N9 + G2 ruling + optional insights) ⏳ awaits the owner; N9's phase-9 scope is owner-confirmed (2026-11-08).** |
| **Current gate** | **Strategy waves 6–7 and phase 8 all CLOSED (N1–N10 complete except N9, which the owner has explicitly deferred to phase 9 with an implementation-forbidden note until then).** Remaining roadmap-#2 items: **phase 9 only — N9 (SSRF-safe link enrichment; MUST start with an `ecc-security-review` threat model), the G2 ruling, optional insights.** After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`. Skills applied in step 31: `ecc-change-impact` (8 modified src files + 2 new modules/routes; NO schema/rules change; ZERO new runtime dependencies; rollback = revert of the step-31 commits), `ecc-security-review` mindset (**N10 performs NO outbound fetch of user-supplied URLs — pure string comparison over already-stored notes, so the N9-class SSRF surface does not exist here**; read-only GET; untrusted query input only folded through the canonicalizer, never stored), `ecc-react-patterns` (hooks unconditional; React-Compiler-safe derivations), `ecc-verification-loop` (23-check runbook incl. negative cases: unique URL silent; trashed duplicate not reported; 400 no-input). |
| Development status | **Full application implemented and running** (see §2). **Roadmap #1 phases 1–4 COMPLETE; roadmap #2: waves 6+7 and phase 8 CLOSED (N1–N8, N10 ✅; N9 owner-deferred to phase 9).** |
| Next allowed step | **Await owner orders only:** (a) phase-9 orders — N9 execution (SSRF-safe link enrichment; starts with the `ecc-security-review` threat model per its card), (b) the G2 ruling (AI / rule-based / none → recorded in `docs/DECISIONS.md`), (c) optional insights (only after N9+G2 rulings), (d) Phase 5 P1 Telegram bridge order (FROZEN). KPI status: Organize-Debt zero-reachable (v28 ✓), round-trip 100% (v28 ✓), Persian search normalized (v29 ✓), Resurfacing Rate measurable (v30 ✓), **silent-duplicate rate target now enforced at capture time (v31 ✓)**. Evidence: 125 pngs. |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up (works against the LOCAL Emulator Suite), honest "continue in demo mode" entry, emulator badge, not-configured fallback.
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, N1 Inbox card, N7 resurfacing card, 4 N4-interactive stat cards, category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: N3-normalized search with live `<mark>` highlighting, filter toolbar (QE2: type chips + favorite/N1 «بدون دسته»/archived/trash chips + category Select incl. `none` + tags popover); QE5 active-filters bar; S1 paginated results; S3 hash deep-links; S6 selection mode; N5 trash management.
  - **Categories**: category CRUD dialog + tags tab; QE3 clickable category cards.
  - **Settings**: profile, theme, language, JSON export, N2 JSON import card, demo-data reset, N7 resurfacing card (toggle + KPI rate), environment/about (incl. undo-rate KPI).
- **N10 DUPLICATE DETECTION ON CAPTURE (v31, verified):**
  - **Matcher (single source):** `src/lib/duplicate.ts` — `normalizeUrlForCompare()` (documented canonical form: scheme kept; host lower-cased; one `www.` dropped; trailing slashes + hash dropped; tracking params stripped; remaining query sorted) + `findDuplicate()` (URL match preferred over title; title = N3-folded EXACT equality; trashed excluded, archived included; newest savedAt wins). **No AI anywhere; v1 is owner-exact (no fuzzy matching); no auto-deletion.**
  - **Demo backend:** `findDuplicateNote` (server/services/notes.ts) + route `GET /api/notes/duplicate` (STATIC beats the `[id]` dynamic segment; 400 `duplicate.no-input`).
  - **Cloud backend:** `repository.findDuplicateNote` — same matcher over the G1 live non-trashed array (zero extra reads).
  - **UI:** QuickCapture amber banner — 400 ms debounced check on (url, title); `role="status"`; category variant («این آیتم پیش‌تر در «…» ذخیره شده») / uncategorized variant; honest hint «ثبت دوباره همچنان آزاد است»; **«مشاهده» closes the capture dialog and opens THAT note's sheet; the save button is NEVER disabled by the result (live-proven)**; `useDuplicateCheck` (`staleTime:0, gcTime:0` — never re-serves a stale cached match; real bug caught in verification).
- **N6 RELATED NOTES (v30, verified):**
  - **Scorer (single source):** `src/lib/related.ts` — `scoreRelated()`/`relatedNotes()` pure functions; weights tag ×3 / category ×2 / type ×1 (`RELATED_WEIGHTS`); a candidate qualifies ONLY with ≥1 shared tag or a shared category (`RELATED_LIMIT=3`); trashed excluded; archived included (DoD decision); ties → newest first. **No AI anywhere — labelled honestly.**
  - **Demo backend:** `getRelatedNotes` (server/services/notes.ts) + route `GET /api/notes/[id]/related` → `{items}`.
  - **Cloud backend:** `repository.getRelatedNotes` — same scorer over the G1 live array (no extra Firestore reads).
  - **UI:** `src/components/app/related-notes.tsx` in the note detail sheet: «مرتبط‌ها» + «بدون AI» badge; compact rows; click → `openNote(id)` swaps the sheet; **renders NOTHING when `[]`** (honest zero state).
- **N7 WEEKLY RESURFACING v1 (v30, verified):**
  - **DoD decision (recorded, per the owner's own recommendation):** **v1 = oldest-first semantics; NO `lastOpenedAt` field; NO schema change.** Candidates = non-trashed notes with `savedAt ≤ now−30d` (archived included), oldest-first, pool cap 10; card copy «از ذخیره‌های قدیمی‌تان» stays honest. Constants `RESURFACE_MIN_AGE_MS`/`RESURFACE_POOL_LIMIT` in `lib/domain/types.ts` (client-safe single source).
  - **Backends:** demo `listResurfaceCandidates` (server/services/stats.ts) + route `GET /api/resurface?limit=`; cloud `repository.resurfaceCandidates` (filter+sort over the live array).
  - **UI:** `src/components/app/resurface-card.tsx` on the dashboard: «یکی دیگر» walks the pool (wraps), item click opens the sheet; ONE card; absent when off or when no candidate exists; hook-order discipline (impression effect before the early return).
  - **Persistence + KPI:** `src/stores/resurface-store.ts` (zustand; localStorage `savedbox.resurface.enabled`, default ON, SSR-safe) — Settings card hosts the Switch + the honest rate; `src/lib/resurface-metrics.ts` records impressions (once per candidate per session) and clicks; **zero external notifications.**
- **N8 INSTALLABLE PWA (v30, verified):**
  - **Manifest:** `src/app/manifest.ts` → `/manifest.webmanifest` (standalone, `start_url /`, fa/rtl, theme #0d9488, 3 icons incl. maskable).
  - **Icons:** AI-generated source → `public/icons/icon-source.png` + PIL-resized 192/512/maskable-512/apple-touch-180.
  - **Service worker:** `public/sw.js` — minimal and conservative: **network-first** for same-origin GETs, runtime cache ONLY navigations + hashed `/_next/static` + `/icons` (API NEVER cached), `/_next/webpack-hmr` excluded, cross-origin + non-GET untouched, versioned cache `savedbox-sw-v1` + old-cache deletion + `skipWaiting` + `clients.claim`.
  - **Registration:** `src/components/app/service-worker-register.tsx` in the root layout (all http(s) origins incl. localhost; failure-tolerant). Layout metadata: manifest + icons + themeColor.
  - **Honesty:** iOS limitations documented (no programmatic install prompt — share-sheet "Add to Home Screen"; SW storage eviction); Lighthouse NOT run (no tooling in sandbox) — mechanical preconditions verified live (§7).
- **N1 VISIBLE INBOX (v28):** `StatsDTO.uncategorized` both backends, dashboard Inbox card (badge → `#/library?cat=none`, explicit zero state), «بدون دسته» FilterChip.
- **N2 JSON IMPORT (v28):** shared zod schema, demo transactional merge, `POST /api/import`, cloud batched import, Settings two-step guardrail, round-trip 100%.
- **N3 PERSIAN SEARCH (v29):** `src/lib/persian.ts` compare-only folding; demo in-memory normalized search; cloud folded `matchesText`; NoteCard equivalence-regex `<mark>` + search-focused snippet. **v31: the same folder now also powers N10 title matching.**
- **N4 INTERACTIVE DASHBOARD (v29):** stat cards → native buttons with clean-view deep-links (`#/library`, `#/library?fav=1`, `#/library?arch=1`); «این هفته» display-only (recorded DoD decision).
- **N5 TRASH MANAGEMENT (v29):** `purge` bulk action + `DELETE /api/trash` (state-guarded both backends, S8 chunks, demo attachment unlink via `isValidFileKey`); shared `TRASH_RETENTION_MS`/`trashDaysLeft`; countdown chips, causal single-purge dialog, mandatory two-step empty-trash, explicit empty state; purge never enters undo metrics.
- **Quick capture dialog**: 5 content types, shared tag chips (QE typeahead), S2 paste-link detection, P3 real file upload (demo verified; cloud honest-unverified → backlog), **N10 duplicate banner (v31)**.
- **Note detail sheet**: metadata, description editing, S4 title/content editing, S2 tag chips, favorite/archive/delete+undo, restore-from-trash, N6 related section, open original, copy content.
- **Note cards**: type-aware thumbnail, favorite toggle, N3 highlighting, category chip, QE1/QE4 layouts, S6 SelectToggle, N5 trash mode.
- **S6 bulk operations (v26, v29-extended)**: `POST /api/notes/bulk` — actions categorize/archive/unarchive/delete/restore/**purge** (≤500 ids; state guards; cloud = one committed writeBatch per ≤500 chunk).
- **P3 real file upload (v26)**: `src/server/storage.ts` + `POST /api/upload` + `GET /api/files/[key]` (allowlist, UUID keys, nosniff).
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API. **v30 additions: `relatedNotes(id)` + `resurfaceCandidates()`. v31 addition: `duplicateCheck(input)`.**
- **G1 REALTIME + OFFLINE (v22):** persistentLocalCache + multi-tab manager; realtimeStore with 3 uncapped onSnapshot listeners per UID; repository reads derive from the live store; demo polls 2 s. N8 adds APP-SHELL offline (browser-level) — deliberately minimal (network-first) so it never serves stale data while online.
- **S5 UNDO DELETE (v23)** + S2 capture unification (v24) + S7→S8→S1→S4→S3 (Phase 2) remain in force under G1.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (unchanged since the 39/39 pass), `scripts/rules-test.ts` (39/39), verification runbooks: `scripts/e2e-verify.sh` (Firebase phase), `scripts/verify-n345.sh` (step 29 — 39 checks), `scripts/verify-n678.sh` (step 30 — 36 checks), **`scripts/verify-n10.sh` (NEW step 31 — 23 checks: server + seed + corpus + API matrix + browser fa/en/1280/390 + evidence pngs, single session)**.
- **i18n/RTL**: type-safe flat dictionaries fa+en (fa default; **v31: +4 `capture.duplicate*` keys — scan: 293 keys per locale, zero duplicates, en≡fa parity exact**), `dir` synced, Persian digits, Vazirmatn.
- **Platform compliance**: single user-visible route `/`; API routes under `src/app/api/**`; sticky-footer rules; shadcn/ui New York only. `/manifest.webmanifest` + `/sw.js` + `/icons/*` are static/metadata assets, not user-visible routes.
- **ECC workflow layer (step 25, commit `9361459`)**: 11 curated skills, `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`; advisory via the harness Skill tool.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only user-visible route: `/`. API routes (`src/app/api/**`), not server actions. `src/app/manifest.ts` is a metadata route (not a page).
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore`; demo list server-paginated (30/page) with 2 s polling.**
- **N10 duplicate contract (v31):** `src/lib/duplicate.ts` is the SINGLE matcher for both backends — canonicalized-URL equality (documented canonical form lives in the module header) preferred over N3-folded exact-title equality; trashed candidates excluded, archived included; newest savedAt wins on multiples; the result is INFORMATIONAL ONLY — it must never disable the save button, never block a capture, and never delete anything; v1 scope = the `url` + `title` fields only (mediaUrl and the sheet EDIT flow are out of scope). If the canonical form changes, both backends change together automatically (shared import) — do not fork the logic. `useDuplicateCheck` MUST keep `staleTime:0, gcTime:0` so a previously-checked value re-fetches instead of re-serving an outdated cached match.
- **N6 related contract (v30):** `src/lib/related.ts` is the SINGLE scorer for both backends — a suggestion requires ≥1 shared tag OR a shared category (type alone never qualifies); limit 3 (RELATED_LIMIT); trashed excluded, archived included; output [] when nothing connects and the UI then renders nothing.
- **N7 resurfacing contract (v30):** v1 semantics (oldest-first, ≥30d, NO lastOpenedAt, NO schema change) recorded per the owner's recommendation; constants live in `lib/domain/types.ts` (client-safe) — the cloud repository must never import from `@/server/*` (would pull Prisma into the client bundle); the toggle is per-device localStorage (`savedbox.resurface.enabled`), NOT a profile field; impressions are de-duplicated per candidate per page session; **no external notifications ever.**
- **N8 PWA contract (v30):** the SW is network-first with a versioned runtime cache (navigations + hashed static + icons only) — API responses are NEVER cached and cross-origin/non-GET requests are never intercepted; every SW change MUST bump `CACHE` (`savedbox-sw-vN`) so the activate handler deletes the old cache; `skipWaiting`+`clients.claim` keep deployments clean; registration failures are non-fatal by design.
- **N1 contract (v28):** `StatsDTO.uncategorized` = live + non-archived + `categoryId null` — identical to the library `cat=none` view on both backends.
- **N2 import contract (v28):** marker-gated zod payload (`app:"savedbox"` OR `source:"firestore"`), caps (≤1000 notes/≤200 cats/≤500 tags/20 MB body/15 MB file), create-only merge (duplicate = exact `type|title|url`), output `ImportReport`; cloud writes = committed writeBatches ≤500 ops.
- **N3 search contract (v29):** `normalizePersian` is the single folding source for matching on both backends (compare-only — stored data never rewritten); the NoteCard highlight regex derives from the same equivalence table. **v31: `findDuplicate` title matching funnels through the same function — one folding source for search AND dedupe.**
- **N4 dashboard contract (v29):** stat cards build CLEAN views (`resetFilters()` first); «این هفته» display-only.
- **N5 trash contract (v29):** `action:"purge"` + `DELETE /api/trash` are permanent deletes guarded to `deletedAt != null`; demo attachment unlink gated by `isValidFileKey`; purge/empty-trash never enter the S5 undo metric; `TRASH_RETENTION_MS` single definition.
- **S6 bulk contract (v26/v29):** `{ids[1..500], action, categoryId?}` → `{ok, updated}`; cloud = one committed batch per ≤500 chunk.
- **P3 upload contract (v26):** multipart 10 MB allowlist → `{url, fileName, fileSize}`; `GET /api/files/[key]` traversal-safe.
- **Sandbox process contract (v29, operational):** the platform reaps agent-spawned processes between tool calls and recycles the sandbox between sessions (5 wipes so far — the 5th at step-30 open: HEAD re-hashed + upload route deleted + backup mirror wiped, all repaired). Server-dependent verification MUST run inside a single tool call via the committed runbooks; after every session start, CHECK: working tree vs HEAD, `src/app/api/upload/route.ts` existence, backup mirror existence.
- **Firebase Emulator Suite (in-sandbox, cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). `.env` (gitignored) carries emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` — demo identifiers, never real credentials. No storage emulator.
- **State:** Zustand (view/detailNoteId/captureOpen/filters/bulkSelectMode + `resurface-store`) + TanStack Query (UID-scoped keys; cache keys: `["related", scope, id]`, `["resurface", scope]`, **`["duplicate", scope, url, title]`**; invalidations from mutations AND the realtime bridge; the duplicate query deliberately polls NOTHING and caches NOTHING (gcTime 0)).
- **React Compiler note (v29):** `bun run lint` enforces `react-hooks/preserve-manual-memoization` — prefer plain derivations (the compiler memoizes) over manual useMemo/useCallback it cannot prove; hooks must run unconditionally before any early return (N7 card pattern; N10 follows it too).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa`; `t()` supports `{var}` interpolation; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e/verify-n345/verify-n678/verify-n10 are verification runbooks run on demand.
- **Agent tooling contract (ECC):** skills = markdown guidance via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` = advisory workflow layer.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست». **Re-issued verbatim with the step-31 order (all 10 items + acceptance criterion).**
- **Step-28 order:** N1 + N2 (v28). **Step-29 order:** N3 + N4 + N5 (v29). **Step-30 order:** N6 + N7 + N8 (v30). **Step-31 order (this step, key points):** «N10 — تشخیص تکرار هنگام ثبت …» (تطابق URL نرمال‌شده با بنیاد N3 + عنوان یکسان؛ فقط هشدار نرم؛ false-positive → فقط URL دقیق/عنوان دقیق در نسخهٔ ۱؛ هیچ حذف خودکاری نیست؛ **داوری: فاز ۷ — بعد از N3**) + «N9 — غنی‌سازی لینک (SSRF-safe) …» with its arbitration «**فاز بعد (۹) — نیازمند زیرساخت و بررسی امنیتی؛ نه MVP**» + the standing 10-point persistence mandate. → **N10 EXECUTED (v31); N9 RECORDED as owner-confirmed phase-9 scope with zero implementation.**
- **N9 phase-9 arbitration (step 31, binding):** the owner re-issued the N9 card verbatim on 2026-11-08; its own arbitration line is now the binding scope note on the roadmap #2 §7 phase-9 checkbox: implementation before phase 9 is FORBIDDEN; when ordered, it MUST start with the `ecc-security-review` threat model (http/https only, private-IP blocking, size/timeout caps, cache, never rewrite a manual title, silent failure states, capture never blocked).
- **N10 v1 decisions (step 31, recorded):** (1) EXACT matching only — canonicalized-URL equality + N3-folded exact-title equality (the owner's stated false-positive mitigation); (2) scope = the `url` + `title` fields (mediaUrl/video-image and the sheet EDIT flow are OUT of v1); (3) trashed candidates excluded (a deleted item is not library pollution); archived included (still a real duplicate); (4) several matches → newest savedAt; (5) the banner is informational — saving is never blocked, nothing is ever auto-deleted; (6) the documented URL canonical form lives in `lib/duplicate.ts` (scheme kept, www. dropped, trailing slash + hash dropped, tracking params stripped, query sorted) — the same page with a DIFFERENT meaningful query string is intentionally NOT a duplicate.
- **N7 v1 decision (step 30, recorded per the ordered card):** v1 — «oldest-first» only, NO `lastOpenedAt` field, NO data-schema change in either mode. Pool: non-trashed, savedAt ≥30d, archived included, cap 10, oldest-first.
- **N6 honesty policy (step 30, binding):** deterministic cache-based co-occurrence — labelled «بدون AI» in the UI badge AND here; type-only overlap never produces a suggestion; empty result = absent section.
- **N8 honesty policy (step 30, binding):** iOS constraints documented (§12 note (f)); Lighthouse not run in the sandbox — verified mechanical preconditions in §7; the SW is network-first precisely so it can never hold updates hostage.
- **Import merge policy (v28, binding):** create-only merge, no automatic deletion/overwrite.
- **N5 irreversible-ops policy (v29, binding):** causal confirmations, state guards, no undo-metric coupling.
- **N4 «این هفته» decision (v29, binding):** display-only.
- **D-note (step 26, still true):** uploaded files live OUTSIDE the repo (`db/uploads/` gitignored) — runtime data, recoverable only by re-uploading; purged notes unlink their demo files (v29).

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO`, `CategoryDTO`, `TagDTO`, `StatsDTO` (+ `uncategorized`), `ProfileDTO`, `NoteFilters`, `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`, `BulkNotesInput`/`BulkNotesResponse` (+ `"purge"`), `EmptyTrashResponse`, `TRASH_RETENTION_MS` + `trashDaysLeft()`, `RESURFACE_MIN_AGE_MS` + `RESURFACE_POOL_LIMIT`, **`DuplicateMatchOn` + `DuplicateCheckInput` + `DuplicateCheckResponse` (v31 — client-safe single source)**, `ImportReport`, `UploadedFileInfo`.
- **Discovery/matching libs (client+server safe, dependency-free):** `src/lib/related.ts` (N6) + `src/lib/persian.ts` (N3) + `src/lib/resurface-metrics.ts` (N7 localStorage metrics) + **`src/lib/duplicate.ts` (N10 — `normalizeUrlForCompare`, `findDuplicate`, `DuplicateHit`; imports only `normalizePersian` + domain types)**.
- **Schema honesty: NO database schema change in v28/v29/v30/v31** (no Prisma migration, no Firestore rules/indexes change since the 39/39 pass).
- **Demo mode:** Prisma/SQLite (Note/Category/Tag/NoteTag/Profile), canonical seed via `POST /api/seed` (8 categories / 16 tags; includes 2 notes >30 days — the N7 candidates). **Demo routes added in v30/v31: `GET /api/notes/[id]/related`, `GET /api/resurface`, `GET /api/notes/duplicate`.**
- **Cloud mode:** Firestore docs per `src/domain/types.ts` under `users/{uid}/…`; rules whitelist unchanged; v30/v31 cloud paths are read-only joins over the live arrays.
- **S5 semantics:** unchanged (+ explicit purge/empty-trash from v29).
- **Upload storage (demo):** `db/uploads/<uuid>.<ext>` — gitignored runtime data.
- **PWA assets (v30):** `public/sw.js`, `public/icons/{icon-source,icon-192,icon-512,icon-maskable-512,apple-touch-icon}.png` — static, tracked in the repo.

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), firebase ^11, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner, lucide-react, zod, z-ai-web-dev-sdk 0.0.18 (dev-tooling usage only — the step-30 icon; NOT a runtime dependency). Install with `bun install`. **Steps 25–31 added ZERO runtime dependencies.**

## 7. Tests & Quality Status

- **Owner rule: no test code.** Verification runbooks run on demand: `scripts/rules-test.ts` (39/39, unchanged rules — last green step 28), `scripts/e2e-verify.sh` (Firebase phase), `scripts/verify-n345.sh` (step 29 — 39/39), `scripts/verify-n678.sh` (step 30 — 36/36), **`scripts/verify-n10.sh` (NEW step 31 — 23/23 PASS)**.
- **Lint:** `bun run lint` **CLEAN — exit 0 at the step-31 close-out.**
- **Type check:** `bunx tsc --noEmit` — **0 errors under `src/`** (pre-existing noise only outside `src/`).
- **Browser verification (mandatory per UI step) — step 31 full DoD via `scripts/verify-n10.sh` (23/23 PASS, fa/en, 1280/390, console errors 0):**
  - **N10 API (12):** exact URL → matchOn=url on the corpus note D1; `EXAMPLE.com/guide/` (case + trailing slash) → same match; `www.…/guide?utm_source=telegram` → same match (www + tracking stripped); different URL → no match; exact title → matchOn=title; Arabic-yeh title «راهنماى پروژه دمو» → SAME match (N3 fold, no false negative); no-input → 400 `duplicate.no-input`; D1 bulk-deleted → no match (trashed excluded); restored → match returns.
  - **N10 UI (11):** banner renders with the category name («این آیتم پیش‌تر در «آموزش» ذخیره شده»); «مشاهده» button present; **save button ENABLED while the banner is visible; a second copy with the same URL SAVES successfully (dialog closes) and the API then proves the second copy EXISTS with newest-wins ranking**; uncategorized match → the no-category banner variant; «مشاهده» closes the capture dialog and opens THAT item's sheet (h2 = «ثبت دوم آزمون»); unique URL → NO banner (silent); EN localized ("This item is already saved"); mobile-390 banner screenshot; browser console 0 errors.
  - **Real bug caught & fixed during verification:** re-opening the capture dialog with a previously-checked URL briefly re-served the stale TanStack-cached match (pre-save state) before the background refetch landed → `useDuplicateCheck` now pins `staleTime:0, gcTime:0` (every check fetches fresh; nothing stale is ever re-served). Also: the title field's QE6 hint shares `role="status"` — runbook banner assertions select by TEXT, not role.
  - Demo DB after the runbook: canonical seed re-applied at close-out (live total 21 — canonical set minus archived/trash view semantics).
- **Liveness checks (step 31):** `ls src/lib/duplicate.ts src/app/api/notes/duplicate/route.ts scripts/verify-n10.sh` → all exist · `ls roadmaps/evidence/n10-*.png | wc -l` → **4** · `ls roadmaps/evidence | wc -l` → **125** · i18n scan → 293/293 keys, 0 dupes, en≡fa parity · `curl /api/notes/duplicate?url=…` → 200 JSON.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must issue a fine-grained PAT (this repo, Contents: R/W). | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–4 + ECC layer + both roadmaps + waves 6–8 + step 31) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** (verified anonymously at the step-30 close-out; re-verify live at every close-out) | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed FIVE times by platform rollbacks (5th at the step-30 open) and rebuilt each time** | Rebuild after any wipe: `git init --bare /home/z/my-project-backup.git && git push backup main`; parity proven with `git ls-remote`. Exact step-31 SHAs in worklog Step 31. |
| **Evidence-count correction (v31)** | ⚠️ v30 recorded "46 pngs total"; the reproducible `ls roadmaps/evidence \| wc -l` is **125** (121 tracked before step 31 + 4 new `n10-*`) | Historical counting-basis error in the v30 text | This row is the correction of record; always re-verify counts live instead of trusting prose. |
| Uploaded files (`db/uploads/`) | ⚠️ Runtime data, NOT in the repo (gitignored by design) | Demo uploads are user data at runtime | Fresh clone starts empty; previously uploaded attachments recoverable **only by re-uploading**; purged notes delete their demo files server-side (v29). |
| P3 cloud upload path | ⚠️ **Unverified** | No storage emulator; real Firebase project frozen | Owner-side Storage bucket + storage rules (Cloud-Go-Live backlog). Cloud purge deletes note docs but NOT Storage objects (v29 note, unchanged). |
| **N10 cloud path (honest scoping)** | ⚠️ Implemented per contract (live-array join, no new rules surfaces) but browser-verified in DEMO mode | Same convention as v28–v30 (emulator pass happens when a step touches writes; N10's cloud path is a read-only join) | When phase 9 / Cloud-Go-Live touches cloud reads again, run the emulator pass for `repository.findDuplicateNote` (same 2-minute pattern as v28's cloud pass). |
| **N8 service worker (production honesty)** | ⚠️ Verified on localhost + manifest/icons; NOT verified in a real install | Lighthouse unavailable in the sandbox; real install needs a deployed HTTPS origin | The mechanical preconditions ARE live-verified (§7, v30). On Cloud-Go-Live: run Lighthouse + a real device install; if the SW strategy ever changes, bump `savedbox-sw-vN`. |
| `.env` Firebase placeholders | ⚠️ Gitignored runtime config (NOT in the repo — by design) | Platform recycle emptied them once (step 28); re-added per the documented contract | If wiped again: append the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` per §3/§8 (demo identifiers). Fresh environment recreates `.env` per §10 step 3. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; canonical sample via `POST /api/seed`. |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders only; production cloud persistence NOT verified (honest). |
| Emulator data | ⚠️ Ephemeral emulator state (untracked) | Runtime-only | Recreate anytime; not product data. |
| Dev server, emulator processes | ⚠️ Not persistent; platform reaps agent-spawned processes between tool calls; boot server died of OOM once (~1.9 GB next-server RSS vs ~4 GB cgroup) | Process state | `bun run dev`; single-session runbooks for all verification. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–4, both roadmaps, the ECC layer, waves 6–8, and step 31) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential — with the explicit exception of `db/uploads/` attachments (re-upload) and the gitignored `.env` (documented recovery). Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v31 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | Clean of tracked modifications at close-out (the v31 docs commit is the last commit; gitignored runtime noise may appear) — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` shows `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea` (frozen); **push blocked (no credential)** |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed at every close-out; parity proven with `git ls-remote` (step-31 exact SHAs in worklog Step 31) |
| Local HEAD at v31 | see `git rev-parse HEAD`. Chain: … v29 `15f66c7`/`9601980`/v29-amendment(`ea17f65`, object retained) → recycle re-hash `d582b81` → step-30 repair `43ac7b0` → **step-30 feature `7b29f77`** → **step-30 docs `b9f3e46`** → v30 ledger amendments `9ba5663`/`a267578` → **step-31 feature commit `feat(n10): capture-time duplicate detection…`** → **step-31 docs commit (THIS snapshot)** → v31 ledger amendment (final HEAD; exact SHAs recorded in worklog Step 31 after the final push) — 45+ commits ahead of frozen origin |
| Phase status | **Roadmap #1: Phases 1–4 ✅, Phase 5 (P1) FROZEN. Roadmap #2: wave 6 CLOSED (N1+N2+N3); wave 7 CLOSED (N4+N5+N10); phase 8 CLOSED (N6+N7+N8); phase 9 ⏳ (N9 owner-arbitrated + G2 ruling + optional insights).** |

**Liveness checks (step 31):**

```bash
ls src/lib/duplicate.ts src/app/api/notes/duplicate/route.ts scripts/verify-n10.sh   # → all exist
ls roadmaps/evidence/n10-*.png | wc -l                                               # → 4
ls roadmaps/evidence | wc -l                                                         # → 125
curl -s "http://localhost:3000/api/notes/duplicate?url=https://x.test/a" ; echo      # → {"note":null,"matchOn":null} (server running)
ls skills | grep -c '^ecc-'                                                          # → 11
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
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (roadmap #1) → `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (roadmap #2 — §7 checkboxes carry per-item DoD evidence; §7 phase 9 carries the N9 arbitration) → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `AGENTS.md` → `docs/ECC-INSTALL.md` → `worklog.md`.
3. `bun install` · **create `.env`** (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` per §3/§8 — gitignored by design) · `bun run db:push`. `db/uploads/` starts empty (runtime data — §4 D-note).
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately (`POST /api/seed` → canonical set); cloud mode needs the emulator or real Firebase env.
5. **ECC skills:** a current `backup` clone already contains `skills/ecc-*`. If missing: re-clone ECC at commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b`, re-run the sweep + checksums per `docs/ECC-INSTALL.md`.
6. **Verification runbooks:** `scripts/verify-n345.sh` (step-29 features), `scripts/verify-n678.sh` (step-30 features) and `scripts/verify-n10.sh` (step-31 feature) each reproduce their full check matrix in ONE session. Remember the sandbox process contract (§3): run inside ONE tool call; after any session start, first diff the working tree against the SHAs recorded in §9 (the recycle pattern can re-hash commits and delete files — see §8 step-30 incident).
7. Resume from §1 "Next allowed step" / roadmap checkboxes (roadmap #1 phases 1–4 done; roadmap #2: waves 6+7 + phase 8 done; phase 9 + G2 ruling + P1 await the owner — **N9 must start with the `ecc-security-review` threat model when ordered**).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure.
2. **Full application build** (`be5caad`) + **Firebase integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → roadmap #1 (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1–QE7 + final regression.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7/S8/S1/S4/S3.
6. **Step 22 — G1 DONE.** SNAPSHOT v22.  7. **Step 23 — S5 DONE.** v23.  8. **Step 24 — S2 DONE (Phase 3 closes).** v24.  9. **Step 25 — ECC layer installed.** v25.  10. **Step 26 — PHASE 4 COMPLETE (S6+QE+P3).** v26.  11. **Step 27 — PRODUCT-STRATEGY ROADMAP REGISTERED (docs-only).** v27.
12. **Step 28 — WAVE 6 OPENED: N1 + N2 COMPLETE** (visible Inbox + JSON import; round-trip 100%; cloud pass; recycle repairs). Commits `dfa816a`/`143b9ce`/`04fdd66`. v28.
13. **Step 29 — N3 + N4 + N5 COMPLETE** (Persian search normalization+highlight; interactive dashboard; trash management) — 39/39 runbook; 2 real bugs fixed. Commits `15f66c7`/`9601980`/v29-amendment. v29.
14. **Step 30 — N6 + N7 + N8 COMPLETE (phase 8 retention wave):** environment repair FIRST (5th recycle: re-hashed amendment + deleted upload route + wiped mirror); N6 related notes (pure scorer, both backends, honest section); N7 resurfacing v1 (recorded no-schema decision, card + persistent toggle + KPI); N8 installable PWA (manifest + icons + minimal network-first SW); 36/36 runbook; 5 evidence pngs. Commits `43ac7b0`/`7b29f77`/`b9f3e46` + ledger amendments `9ba5663`/`a267578`. v30.
15. **Step 31 — N10 COMPLETE (this step; wave-7 closure):**
    - **N10 duplicate detection on capture:** shared pure matcher (`lib/duplicate.ts`: documented URL canonical form + N3-folded exact-title equality; trashed excluded, archived included, newest-wins; soft non-blocking banner in QuickCapture with «مشاهده» → sheet; save never disabled — live-proven); demo `GET /api/notes/duplicate` + cloud live-array path; `useDuplicateCheck` with `staleTime:0, gcTime:0` (stale-serve bug caught and fixed during verification).
    - **N9 recorded, NOT implemented:** owner re-issued the card with its phase-9 arbitration; the roadmap §7 phase-9 checkbox now carries the binding note; zero N9 code.
    - Quality: lint exit 0; tsc 0 under `src/`; **23/23 runbook checks** (`scripts/verify-n10.sh`); 4 evidence pngs; console errors 0; i18n scan 293/293 en≡fa. Demo DB re-seeded canonically at close-out. SNAPSHOT v31.

## 12. Remaining Work & Known State

- **Roadmap #2 (awaiting owner orders):** **phase 9 only — (1) N9 SSRF-safe link enrichment (owner-arbitrated; MUST start with the `ecc-security-review` threat model: http/https only, private-IP block, size/timeout caps, cache, never rewrite manual titles, silent failure, capture never blocked); (2) the G2 ruling (AI / rule-based / none → `docs/DECISIONS.md`); (3) optional insights (only after both rulings).** Roadmap #1's **Phase 5 P1 Telegram bridge (FROZEN)**. N1–N8 + N10 are all COMPLETE and verified.
- **Cloud-Go-Live backlog:** P3 cloud upload verification; cloud purge does not delete Storage objects; password-reset link (QE7); composite-index pruning; optional server-side trash purge; **PWA hardening on the deployed origin (Lighthouse + real-device install; SW cache-name bump policy §3)**; N10 emulator pass for the cloud read path (convention note §8).
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7); phase-9 orders; G2 ruling; P1 order.
- **Honest note (a) — N7 v1 semantics:** the card surfaces the OLDEST saves ≥30d; "never re-opened" tracking was deliberately deferred (owner-recommended v1). The Settings rate is a click-through rate of the card, not a resurrection rate of "forgotten" items specifically.
- **Honest note (b) — N7 wrap-around:** «یکی دیگر» wraps after the pool end (≤10 candidates) instead of disabling — chosen for simplicity.
- **Honest note (c) — N6 ranking subjectivity:** weights (3/2/1) and the newest-first tie-break are product judgments recorded here; trivially tunable in ONE place (`lib/related.ts`).
- **Honest note (d) — N8 Lighthouse:** not run (no tooling in the sandbox); the verified preconditions are enumerated in §7 (v30). iOS: no programmatic install prompt, no custom splash beyond Apple's heuristics, SW storage subject to iOS eviction.
- **Honest note (e) — cloud paths:** N6/N7 (v30) and N10 (v31) cloud paths are implemented per contract (read-only live-array joins) but browser-verified in DEMO mode (same honest scoping convention as v28–v30; no new rules surfaces — reads are already owner-scoped).
- **Honest note (f) — step-30 recycle incident:** the 5th platform wipe re-hashed the v29 amendment commit and deleted the upload route; both repaired before feature work and recorded in §8/§11. FUTURE SESSIONS: always diff the working tree against the SHAs recorded in §9 first.
- **Honest note (g) — N10 v1 exactness:** the documented canonical form is intentionally conservative — the same page with a DIFFERENT meaningful query string is NOT a duplicate (only tracking-param/case/www/trailing-slash differences fold); mediaUrl and the sheet EDIT flow are outside v1 (capture-time only, per the ordered card).
- **Honest note (h) — evidence counts:** always re-verify live (`ls roadmaps/evidence | wc -l` → 125 at v31); the v30 "46" figure was a miscount, corrected in §8.
- **Lint (standing):** re-verified CLEAN at the step-31 close-out (exit 0). tsc noise: pre-existing lines outside `src/` (unchanged).
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure".

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05 and re-issued verbatim with every step order (latest: step 31, all 10 items + acceptance criterion): after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump v31 + date).
2. [x] Affected reference docs updated: `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (N10 checkbox `[x]` + DoD evidence + recorded decisions; phase-9 N9 arbitration note; §8 persistence state → step 31), `docs/ROADMAP.md` (strategy-wave execution status → step 31), `worklog.md` (Step 31 entry). Scope honesty: `docs/DECISIONS.md` unchanged (no new ruling — the step executed an existing owner order and recorded an arbitration; N10's v1 policies are implementation decisions recorded in §4), `docs/CHANGELOG.md`/`docs/ENVIRONMENT.md` unchanged (no Brief delta).
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA (§9; exact SHAs in worklog Step 31 after the final push + ledger amendment).
4. [x] `git status` reviewed before commit — feature files (8 modified + `lib/duplicate.ts` + `api/notes/duplicate/route.ts`) + runbook + roadmap + 4 evidence pngs staged and verified exclusive; nothing essential left in temp locations (`tool-results/` gitignored; `/tmp` probe files ephemeral and reproducible per §7).
5. [x] Commit with a descriptive message (feature commit + docs commit + ledger amendment).
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method (incl. the gitignored `.env` contract + the evidence-count correction). Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer, Phase 4, both roadmaps, waves 6–8 and step 31) today — except `db/uploads/` attachments and the gitignored `.env` (both documented with recovery methods above); true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
