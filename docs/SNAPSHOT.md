# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 30 · **Date:** 2026-11-08 · **Snapshot author:** Z.ai Code agent
> **v30 changelog:** **STEP 30 — N6 + N7 + N8 COMPLETE (owner order; phase 8 retention wave, first three items).** **N6 related notes (NO AI):** pure co-occurrence scorer `src/lib/related.ts` (shared tag ×3 / shared category ×2 / shared type ×1; a suggestion REQUIRES ≥1 real shared tag or a shared category — type alone never qualifies; limit 3; trashed excluded, archived included; tie-break newest-first) — the SINGLE ranking source for both backends; demo `GET /api/notes/[id]/related` (service fetches the pool, lib scorer ranks); cloud `repository.getRelatedNotes` over the G1 live array (zero extra reads); sheet section `related-notes.tsx` («مرتبط‌ها» + honest «بدون AI» badge) renders ONLY when a genuine connection exists (isolated notes and single-item libraries get no section — verified), click swaps the sheet to that item. **N7 resurfacing v1 (NO AI):** recorded DoD decision — **v1 = «oldest-first» semantics, NO `lastOpenedAt` field, NO schema change** (per the owner's own recommendation); demo `GET /api/resurface` + `listResurfaceCandidates` (non-trashed, savedAt ≥30d, archived INCLUDED, oldest-first, pool ≤10; constants in domain types — client-safe single source); cloud `repository.resurfaceCandidates` (filter+sort over the live array); dashboard card `resurface-card.tsx` «از ذخیره‌های قدریمی‌تان» (honest copy — "older saves", never "never opened"): ONE card, only when a candidate exists AND the feature is on, «یکی دیگر» walks the pool (wraps), item click opens the sheet; persistent per-device off-switch (`resurface-store.ts` → localStorage `savedbox.resurface.enabled`, hydrated post-mount, SSR-safe); KPI micro-events `src/lib/resurface-metrics.ts` (impressions once-per-candidate-per-session + clicks → the §9 rate, displayed in the new Settings card); zero external notifications. **N8 installable PWA:** `src/app/manifest.ts` (`/manifest.webmanifest` — standalone, `start_url /`, fa/rtl, theme #0d9488, 3 icons incl. maskable) + AI-generated icon (image-generation CLI → `public/icons/icon-source.png`, PIL-resized to 192/512/maskable-512/apple-touch-180) + minimal conservative SW `public/sw.js` (**network-first** same-origin GETs, runtime cache only navigations + hashed `/_next/static` + icons, API never cached, versioned cache + skipWaiting + clients.claim + old-cache cleanup — a stale SW can never trap updates) + `service-worker-register.tsx` mounted in the root layout (all http(s) origins incl. localhost; failure-tolerant) + manifest/apple-icon/themeColor metadata. **Verification (36/36 checks, `scripts/verify-n678.sh` runbook, browser+API, fa/en, 1280/390, console 0):** N6 — related(R1)=[R2(score 4),R3(score 3)] EXACT, isolated note → 0 related + NO section, «بدون AI» label, click-through swaps the sheet; N7 — 2 candidates ≥30d oldest-first, card visible with the oldest seed item, «یکی دیگر» cycles, click → sheet + micro-events 2/1, negative case (candidates trashed → card gone → restore → card back), toggle-off → hidden → reload → STILL hidden (persisted) → toggle-on → back, EN localized; N8 — manifest 200+valid, all 4 icons 200 image/png, sw.js 200, `<link rel=manifest>` in head, **SW registered AND active in the live browser**, manifest fetchable+valid from the page. **5th platform recycle repaired first:** HEAD found re-hashed (`ea17f65`→`d582b81` amend) with `src/app/api/upload/route.ts` DELETED by the recycle + backup mirror wiped → route restored from the still-existing object, repair commit, mirror rebuilt, parity proven BEFORE any new work (same documented pattern as step 28). Lint exit 0; `tsc --noEmit` 0 errors under `src/` (caught a missing NoteDTO type import — tsc is a standing gate). 7 new evidence pngs (`n6-*`, `n7-*`, `n8-*`; 48 total).
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
| Roadmap #2 | **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md` v1.0** (2026-11-07) — "Next Value" wave: N1–N10 + G2 decision package, phases **6–9**. **Wave 6 CLOSED (N1+N2+N3 ✅). Wave 7: N4+N5 ✅, N10 ⏳ owner order. Phase 8: N6+N7+N8 ✅ (step 30). Phase 9 (N9 + G2 ruling + optional insights) ⏳ awaits the owner.** |
| **Current gate** | **Strategy wave 8 in progress (owner's step-30 order: N6 + N7 + N8 — all three executed, verified, persisted).** Remaining roadmap-#2 items: **N10 (duplicate detection — wave 7 leftover, unblocked by N3) and phase 9 (N9 SSRF-safe link enrichment + the G2 ruling + optional insights) — all awaiting explicit owner orders.** After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`. Skills applied in step 30: `ecc-change-impact` (blast radius: 11 modified files + 6 new modules/assets; NO rules change; Prisma schema UNCHANGED per the N7 v1 decision), `ecc-security-review` mindset (SW threat model: network-first so no stale trapping, same-origin GET-only interception, dev HMR path excluded, cross-origin untouched; N6/N7 expose read-only endpoints with no user-supplied filesystem paths), `ecc-react-patterns` (hook-order discipline in ResurfaceCard — effects before early returns), `ecc-verification-loop` (36-check runbook incl. negative cases: isolated-note section absence, candidates-trashed card absence, persistent-off reload). |
| Development status | **Full application implemented and running** (see §2). **Roadmap #1 phases 1–4 COMPLETE; roadmap #2: wave 6 CLOSED, wave 7 N4+N5 ✅ (N10 ⏳), phase 8 N6+N7+N8 ✅.** |
| Next allowed step | **Await owner orders only:** (a) N10 execution order (duplicate detection on capture; N3/N6 foundations ready), (b) phase 9 orders (N9 SSRF-safe link enrichment — requires `ecc-security-review` at implementation time; optional insights), (c) the G2 ruling (AI / rule-based / none → recorded in `docs/DECISIONS.md`), (d) Phase 5 P1 Telegram bridge order (FROZEN). KPI status: Organize-Debt zero-reachable (v28 ✓), round-trip 100% (v28 ✓), Persian search normalized (v29 ✓), Resurfacing Rate now MEASURABLE (micro-events live, §9). Evidence: 48 pngs. |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up (works against the LOCAL Emulator Suite), honest "continue in demo mode" entry, emulator badge, not-configured fallback.
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, N1 Inbox card, **N7 resurfacing card (below)**, **4 N4-interactive stat cards**, category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: N3-normalized search with live `<mark>` highlighting, filter toolbar (QE2: type chips + favorite/N1 «بدون دسته»/archived/trash chips + category Select incl. `none` + tags popover); QE5 active-filters bar; S1 paginated results; S3 hash deep-links; S6 selection mode; N5 trash management.
  - **Categories**: category CRUD dialog + tags tab; QE3 clickable category cards.
  - **Settings**: profile, theme, language, JSON export, N2 JSON import card, demo-data reset, **N7 resurfacing card (toggle + KPI rate)**, environment/about (incl. undo-rate KPI).
- **N6 RELATED NOTES (v30, verified):**
  - **Scorer (single source):** `src/lib/related.ts` — `scoreRelated()`/`relatedNotes()` pure functions; weights tag ×3 / category ×2 / type ×1 (`RELATED_WEIGHTS`); a candidate qualifies ONLY with ≥1 shared tag or a shared category (`RELATED_LIMIT=3`); trashed excluded; archived included (DoD decision); ties → newest first. **No AI anywhere — labelled honestly.**
  - **Demo backend:** `getRelatedNotes` (server/services/notes.ts) — pool = all non-trashed notes incl. relations; route `GET /api/notes/[id]/related` → `{items}` (≤3; [] when nothing connects).
  - **Cloud backend:** `repository.getRelatedNotes` — the same scorer over the G1 live array (no extra Firestore reads; current note must be live-resolvable).
  - **UI:** `src/components/app/related-notes.tsx` mounted in the note detail sheet (after the description, before actions): header «مرتبط‌ها» + «بدون AI» badge; compact rows (type icon tile, title, category-or-type · relative time); click → `openNote(id)` swaps the sheet; **renders NOTHING when `[]`** (honest zero state — no fake suggestions in small libraries; verified with an isolated note).
- **N7 WEEKLY RESURFACING v1 (v30, verified):**
  - **DoD decision (recorded, per the owner's own recommendation):** **v1 = oldest-first semantics; NO `lastOpenedAt` field; NO schema change.** Candidate pool = non-trashed notes with `savedAt ≤ now−30d` (archived included — they are the most-forgotten surface), oldest-first, pool cap 10; card copy «از ذخیره‌های قدیمی‌تان» stays honest (never claims "never opened"). Constants `RESURFACE_MIN_AGE_MS`/`RESURFACE_POOL_LIMIT` in `lib/domain/types.ts` (client-safe single source — the cloud repository must NOT import server modules).
  - **Backends:** demo `listResurfaceCandidates` (server/services/stats.ts) + route `GET /api/resurface?limit=`; cloud `repository.resurfaceCandidates` (filter+sort over the live array).
  - **UI:** `src/components/app/resurface-card.tsx` on the dashboard (between the Inbox card and the stats): History icon + title + hint, «یکی دیگر» (RefreshCw) walks the pool (wraps modulo length), item row opens the sheet; **one card only; absent when off or when no candidate exists (verified via the trash→restore negative case)**; hook-order discipline (impression effect runs before the early return).
  - **Persistence + KPI:** `src/stores/resurface-store.ts` (zustand; localStorage `savedbox.resurface.enabled`, default ON, hydrate-after-mount SSR-safe) — the Settings card (`ResurfaceCard` in settings-view.tsx) hosts the Switch + the honest rate readout; `src/lib/resurface-metrics.ts` records impressions (once per candidate per page session — the 2 s demo poll cannot inflate) and clicks → rate shown as «{clicks} از {impressions} ({percent}٪)»; **zero external notifications (owner warning §۶ respected — nothing outside the app).**
- **N8 INSTALLABLE PWA (v30, verified):**
  - **Manifest:** `src/app/manifest.ts` → `/manifest.webmanifest` (name/short_name fa, `id: "/"`, `start_url: "/"`, `scope: "/"`, `display: standalone`, `background #ffffff`, `theme_color #0d9488`, `dir: rtl`, icons 192 + 512 (any) + 512 (maskable)).
  - **Icons:** AI-generated source (image-generation CLI, flat white bookmark on teal rounded square) → `public/icons/icon-source.png` + PIL-resized `icon-192.png` / `icon-512.png` / `icon-maskable-512.png` (glyph padded to ~80% inside a solid-teal canvas for circular masks) / `apple-touch-icon.png` (180).
  - **Service worker:** `public/sw.js` — minimal and conservative: **network-first** for same-origin GETs (a stale SW can never serve old bytes while online), runtime cache ONLY for navigations/`/`/hashed `/_next/static`/`/icons` (API responses NEVER cached), `/_next/webpack-hmr` excluded (dev HMR safe), cross-origin + non-GET untouched (Firebase/gateway pass through), versioned cache `savedbox-sw-v1` + old-cache deletion on activate + `skipWaiting` + `clients.claim` (clean takeover on deploy).
  - **Registration:** `src/components/app/service-worker-register.tsx` mounted in the root layout (registers post-load on every http(s) origin incl. localhost so the sandbox can verify; failures swallowed — progressive enhancement). Layout metadata gained `manifest`, `icons.icon/apple`, and `viewport.themeColor`.
  - **Honesty (owner-ordered):** iOS limitations documented (no in-app install prompt — "Add to Home Screen" via the share sheet; standalone quirks; SW support present in modern iOS but with cache eviction); Lighthouse was NOT run (no tooling in the sandbox) — the mechanical installability preconditions ARE verified live: manifest served+valid, SW registered AND active, icons 200 image/png, start_url 200 (§7).
- **N1 VISIBLE INBOX (v28):** `StatsDTO.uncategorized` both backends, dashboard Inbox card (badge → `#/library?cat=none`, explicit zero state), «بدون دسته» FilterChip.
- **N2 JSON IMPORT (v28):** shared zod schema, demo transactional merge, `POST /api/import`, cloud batched import, Settings two-step guardrail, round-trip 100%.
- **N3 PERSIAN SEARCH (v29):** `src/lib/persian.ts` compare-only folding; demo in-memory normalized search; cloud folded `matchesText`; NoteCard equivalence-regex `<mark>` + search-focused snippet.
- **N4 INTERACTIVE DASHBOARD (v29):** stat cards → native buttons with clean-view deep-links (`#/library`, `#/library?fav=1`, `#/library?arch=1`); «این هفته» display-only (recorded DoD decision).
- **N5 TRASH MANAGEMENT (v29):** `purge` bulk action + `DELETE /api/trash` (state-guarded both backends, S8 chunks, demo attachment unlink via `isValidFileKey`); shared `TRASH_RETENTION_MS`/`trashDaysLeft`; countdown chips, causal single-purge dialog, mandatory two-step empty-trash, explicit empty state; purge never enters undo metrics.
- **Quick capture dialog**: 5 content types, shared tag chips (QE typeahead), S2 paste-link detection, P3 real file upload (demo verified; cloud honest-unverified → backlog).
- **Note detail sheet**: metadata, description editing, S4 title/content editing, S2 tag chips, favorite/archive/delete+undo, restore-from-trash, **N6 related section**, open original, copy content.
- **Note cards**: type-aware thumbnail, favorite toggle, N3 highlighting, category chip, QE1/QE4 layouts, S6 SelectToggle, N5 trash mode.
- **S6 bulk operations (v26, v29-extended)**: `POST /api/notes/bulk` — actions categorize/archive/unarchive/delete/restore/**purge** (≤500 ids; state guards; cloud = one committed writeBatch per ≤500 chunk).
- **P3 real file upload (v26)**: `src/server/storage.ts` + `POST /api/upload` + `GET /api/files/[key]` (allowlist, UUID keys, nosniff).
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API. **v30 additions: `relatedNotes(id)` + `resurfaceCandidates()` dispatch.**
- **G1 REALTIME + OFFLINE (v22):** persistentLocalCache + multi-tab manager; realtimeStore with 3 uncapped onSnapshot listeners per UID; repository reads derive from the live store; demo polls 2 s. **v30 note: the N8 service worker adds APP-SHELL offline (browser-level) — conceptually complementary to the G1 data-level offline cache, and deliberately minimal (network-first) so it never serves stale data while online.**
- **S5 UNDO DELETE (v23)** + S2 capture unification (v24) + S7→S8→S1→S4→S3 (Phase 2) remain in force under G1.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (unchanged since the 39/39 pass), `scripts/rules-test.ts` (39/39), verification runbooks: `scripts/e2e-verify.sh` (Firebase phase), **`scripts/verify-n345.sh` (step 29 — 39 checks)**, **`scripts/verify-n678.sh` (NEW step 30 — 36 checks: server + seed + corpus + API matrix + browser fa/en/1280/390 + evidence pngs, single session)**.
- **i18n/RTL**: type-safe flat dictionaries fa+en (fa default; **v30: N6 `note.related.*` + N7 `dashboard.resurface.*`/`settings.resurface.*`/`a11y.resurface.*` — 296 keys per locale, zero duplicates, verified by scan**), `dir` synced, Persian digits, Vazirmatn.
- **Platform compliance**: single user-visible route `/`; API routes under `src/app/api/**`; sticky-footer rules; shadcn/ui New York only. **v30: `/manifest.webmanifest` + `/sw.js` + `/icons/*` are static/metadata assets, not user-visible routes.**
- **ECC workflow layer (step 25, commit `9361459`)**: 11 curated skills, `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md`; advisory via the harness Skill tool.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only user-visible route: `/`. API routes (`src/app/api/**`), not server actions. **v30: `src/app/manifest.ts` is a metadata route (not a page).**
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore`; demo list server-paginated (30/page) with 2 s polling.**
- **N6 related contract (v30):** `src/lib/related.ts` is the SINGLE scorer for both backends — a suggestion requires ≥1 shared tag OR a shared category (type alone never qualifies); limit 3 (RELATED_LIMIT); trashed excluded, archived included; output [] when nothing connects and the UI then renders nothing. If weights/thresholds change, both backends change together automatically (shared import) — do not fork the logic.
- **N7 resurfacing contract (v30):** v1 semantics (oldest-first, ≥30d, NO lastOpenedAt, NO schema change) recorded per the owner's recommendation; constants live in `lib/domain/types.ts` (client-safe) — the cloud repository must never import from `@/server/*` (would pull Prisma into the client bundle); the toggle is per-device localStorage (`savedbox.resurface.enabled`), NOT a profile field; impressions are de-duplicated per candidate per page session; **no external notifications ever.**
- **N8 PWA contract (v30):** the SW is network-first with a versioned runtime cache (navigations + hashed static + icons only) — API responses are NEVER cached and cross-origin/non-GET requests are never intercepted; every SW change MUST bump `CACHE` (`savedbox-sw-vN`) so the activate handler deletes the old cache; `skipWaiting`+`clients.claim` keep deployments clean; registration failures are non-fatal by design.
- **N1 contract (v28):** `StatsDTO.uncategorized` = live + non-archived + `categoryId null` — identical to the library `cat=none` view on both backends.
- **N2 import contract (v28):** marker-gated zod payload (`app:"savedbox"` OR `source:"firestore"`), caps (≤1000 notes/≤200 cats/≤500 tags/20 MB body/15 MB file), create-only merge (duplicate = exact `type|title|url`), output `ImportReport`; cloud writes = committed writeBatches ≤500 ops.
- **N3 search contract (v29):** `normalizePersian` is the single folding source for matching on both backends (compare-only — stored data never rewritten); the NoteCard highlight regex derives from the same equivalence table.
- **N4 dashboard contract (v29):** stat cards build CLEAN views (`resetFilters()` first); «این هفته» display-only.
- **N5 trash contract (v29):** `action:"purge"` + `DELETE /api/trash` are permanent deletes guarded to `deletedAt != null`; demo attachment unlink gated by `isValidFileKey`; purge/empty-trash never enter the S5 undo metric; `TRASH_RETENTION_MS` single definition.
- **S6 bulk contract (v26/v29):** `{ids[1..500], action, categoryId?}` → `{ok, updated}`; cloud = one committed batch per ≤500 chunk.
- **P3 upload contract (v26):** multipart 10 MB allowlist → `{url, fileName, fileSize}`; `GET /api/files/[key]` traversal-safe.
- **Sandbox process contract (v29, operational):** the platform reaps agent-spawned processes between tool calls and recycles the sandbox between sessions (see §8 — 5th wipe at step 30 open: HEAD re-hashed + upload route deleted + backup mirror wiped). Server-dependent verification MUST run inside a single tool call via the committed runbooks; after every session start, CHECK: working tree vs HEAD, `src/app/api/upload/route.ts` existence, backup mirror existence.
- **Firebase Emulator Suite (in-sandbox, cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). `.env` (gitignored) carries emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` — demo identifiers, never real credentials. No storage emulator.
- **State:** Zustand (view/detailNoteId/captureOpen/filters/bulkSelectMode + **v30 `resurface-store`**) + TanStack Query (UID-scoped keys; **v30 cache keys: `["related", scope, id]`, `["resurface", scope]`**; invalidations from mutations AND the realtime bridge).
- **React Compiler note (v29):** `bun run lint` enforces `react-hooks/preserve-manual-memoization` — prefer plain derivations (the compiler memoizes) over manual useMemo/useCallback it cannot prove; hooks must run unconditionally before any early return (N7 card pattern).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa`; `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e/verify-n345/verify-n678 are verification runbooks run on demand.
- **Agent tooling contract (ECC):** skills = markdown guidance via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` = advisory workflow layer.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست».
- **Step-28 order:** N1 + N2 (v28). **Step-29 order:** N3 + N4 + N5 (v29). **Step-30 order (this step, verbatim key points):** «N6 — یادداشت‌های مرتبط (بدون AI) …» (امتیازدهی co-occurrence: تگ بالا/دسته متوسط/نوع کم؛ آستانه؛ حداکثر ۳؛ نمایش فقط با اشتراک واقعی تگ/دسته؛ برچسب صادقانه «بدون AI») + «N7 — بازکشف هفتگی (بدون AI) …» (کارت «از ذخیره‌های قدیمی‌تان»، آیتم قدیمی‌تر از ۳۰ روز، «یکی دیگر»، خاموشی در تنظیمات؛ **نسخهٔ ۱ توصیه‌شدهٔ مالک = بدون فیلد جدید؛ انتخاب هنگام اجرا با تأیید مالک ثبت شود**) + «N8 — PWA نصب‌پذیر …» (manifest + آیکون‌ها + SW حداقلی با نسخه‌بندی + skip-waiting؛ صداقت دربارهٔ iOS) + the standing 10-point persistence mandate. Remaining un-ordered: N10, N9, G2 ruling, optional insights, P1.
- **N7 v1 decision (step 30, recorded per the ordered card):** implemented **v1 — «oldest-first» only, NO `lastOpenedAt` field, NO data-schema change in either mode** (the owner's card explicitly recommends v1; the heavier "never re-opened" tracking is deferred to a possible v2 and would be a small two-mode schema change). Pool: non-trashed, savedAt ≥30d, archived included, cap 10, oldest-first; card copy stays honest («قدیمی‌ترین ذخیره‌ها», never «هرگز باز نشده»).
- **N6 honesty policy (step 30, binding):** the feature is deterministic cache-based co-occurrence — labelled «بدون AI» in the UI badge AND here; type-only overlap never produces a suggestion; empty result = absent section.
- **N8 honesty policy (step 30, binding):** iOS constraints documented (§12 honest note (f)); Lighthouse not run in the sandbox — the verified mechanical preconditions are listed in §7; the SW is network-first precisely so it can never hold updates hostage.
- **Import merge policy (v28, binding):** create-only merge, no automatic deletion/overwrite.
- **N5 irreversible-ops policy (v29, binding):** causal confirmations, state guards, no undo-metric coupling.
- **N4 «این هفته» decision (v29, binding):** display-only.
- **D-note (step 26, still true):** uploaded files live OUTSIDE the repo (`db/uploads/` gitignored) — runtime data, recoverable only by re-uploading; purged notes unlink their demo files (v29).

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO`, `CategoryDTO`, `TagDTO`, `StatsDTO` (+ `uncategorized`), `ProfileDTO`, `NoteFilters`, `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`, `BulkNotesInput`/`BulkNotesResponse` (+ `"purge"`), `EmptyTrashResponse`, `TRASH_RETENTION_MS` + `trashDaysLeft()`, **`RESURFACE_MIN_AGE_MS` + `RESURFACE_POOL_LIMIT` (v30 — client-safe single source)**, `ImportReport`, `UploadedFileInfo`.
- **Discovery libs (client+server safe, dependency-free):** `src/lib/related.ts` (`RELATED_WEIGHTS`, `RELATED_LIMIT`, `scoreRelated`, `relatedNotes`, `RelatedScore`) + `src/lib/persian.ts` (N3) + `src/lib/resurface-metrics.ts` (`recordResurfaceImpression/recordResurfaceClick/getResurfaceMetrics` — localStorage `savedbox.resurfaceMetrics`).
- **Schema honesty: NO database schema change in v28/v29/v30** (N7 v1 explicitly avoided one; no Prisma migration, no Firestore rules/indexes change in this step).
- **Demo mode:** Prisma/SQLite (Note/Category/Tag/NoteTag/Profile), canonical seed 23 notes / 8 categories / 16 tags via `POST /api/seed` (seed `minutesAgo` spread includes 2 notes >30 days — the N7 candidates). **v30 demo routes: `GET /api/notes/[id]/related`, `GET /api/resurface`.**
- **Cloud mode:** Firestore docs per `src/domain/types.ts` under `users/{uid}/…`; rules whitelist unchanged; **v30 cloud paths are read-only joins over the live arrays.**
- **S5 semantics:** unchanged (+ explicit purge/empty-trash from v29).
- **Upload storage (demo):** `db/uploads/<uuid>.<ext>` — gitignored runtime data.
- **PWA assets (v30):** `public/sw.js`, `public/icons/{icon-source,icon-192,icon-512,icon-maskable-512,apple-touch-icon}.png` — static, tracked in the repo (icons ARE repo content; the source 1024px PNG is kept for future re-derivation).

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), firebase ^11, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner, lucide-react, zod, z-ai-web-dev-sdk 0.0.18 (**used at step 30 for the app icon via the CLI — dev-tooling usage, NOT a runtime dependency**). Install with `bun install`. **Steps 25–30 added ZERO runtime dependencies** (PIL used at build-asset time only, not shipped).

## 7. Tests & Quality Status

- **Owner rule: no test code.** Verification runbooks run on demand: `scripts/rules-test.ts` (39/39, unchanged rules — last green step 28), `scripts/e2e-verify.sh` (Firebase phase), `scripts/verify-n345.sh` (step 29 — 39/39), **`scripts/verify-n678.sh` (NEW step 30 — 36/36 PASS)**.
- **Lint:** `bun run lint` **CLEAN — exit 0 at the step-30 close-out.**
- **Type check:** `bunx tsc --noEmit` — **0 errors under `src/`** (caught one real miss: `NoteDTO` type import in stats.ts; pre-existing noise only in `examples/` + `skills/image-edit`).
- **Browser verification (mandatory per UI step) — step 30 full DoD via `scripts/verify-n678.sh` (36/36 PASS, fa/en, 1280/390, console errors 0):**
  - **N6 API:** related(R1) = [«چک‌لیست استقرار پروژه» (score 4: tag+type), «راهنمای پروژه» (score 3: tag)] EXACT order; isolated note → 0 related.
  - **N6 UI:** sheet of a tagged note renders «مرتبط‌ها» + «بدون AI» badge + both related rows (sheet-scoped assertions — the library grid behind the sheet is excluded from the checks); clicking a related row swaps the sheet to THAT item (`h2` = its title); the isolated note's sheet has NO «مرتبط‌ها» section.
  - **N7 API:** 2 canonical candidates, both ≥30 days old, oldest-first.
  - **N7 UI:** card visible with the oldest seed item («مقاله: آیندهٔ هوش مصنوعی در ابزارهای توسعه» — 6 weeks old); «یکی دیگر» cycles to the second candidate; item click opens that sheet; micro-events `impressions/clicks = 2/1` in localStorage; **negative case:** candidates trashed via API → card disappears (2 s poll) → restore → card returns; settings toggle off → card hidden → **reload → still hidden (persistent)** → toggle on → card returns; EN title localized. Evidence: `n7-resurface-card-fa-1280.png`, `n7-settings-fa-1280.png`, `n7-mobile-390.png`.
  - **N8 static:** manifest 200 + valid (standalone/start_url/3 icons/theme #0d9488); 4 icon files 200 `image/png`; sw.js 200. **N8 live:** `<link rel="manifest">` in head; `navigator.serviceWorker.getRegistration()` → **ACTIVE** (twice-asserted); manifest fetched from the page and validated. Evidence: `n8-pwa-fa-1280.png`.
  - **N6 evidence:** `n6-related-fa-1280.png` (sheet with the «مرتبط‌ها» section + «بدون AI» badge).
  - Demo DB after the runbook: canonical seed + 4 N6 corpus notes (R1–R4, 3 tagged «پروژه-الفا» + 1 isolated). Re-seeded canonically at close-out (§12).
- **Liveness checks (step 30):** `ls src/lib/related.ts src/lib/resurface-metrics.ts src/stores/resurface-store.ts src/app/manifest.ts public/sw.js src/components/app/related-notes.tsx src/components/app/resurface-card.tsx src/components/app/service-worker-register.tsx scripts/verify-n678.sh` → all exist · `ls roadmaps/evidence/n6-*.png roadmaps/evidence/n7-*.png roadmaps/evidence/n8-*.png | wc -l` → **7** (48 total) · `curl /manifest.webmanifest` → 200 · `ls skills | grep -c '^ecc-'` → **11**.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must issue a fine-grained PAT (this repo, Contents: R/W). | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–4 + ECC layer + both roadmaps + waves 6–8 progress) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** (verified anonymously at the step-30 close-out) | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed FIVE times by platform rollbacks (5th found MISSING at the step-30 open, 2026-11-08) and rebuilt each time** | **Rebuilt per the documented 1-command procedure at the step-30 open** (after the recycle-repair commit) → pushed → parity EQUAL (LOCAL == REMOTE, proven; exact SHAs in worklog Step 30). Rebuild after any wipe: `git init --bare /home/z/my-project-backup.git && git push backup main` |
| **Platform recycle — step-30 incident (5th)** | ⚠️ REPAIRED before any new work | Between sessions the platform re-created the v29 amendment commit with a NEW SHA (`ea17f65`→`d582b81`, mode churn) **and deleted `src/app/api/upload/route.ts`** (exactly the step-28 pattern) + wiped the backup mirror | Repair: route restored from the still-existing `ea17f65` object (`git checkout ea17f65 -- src/app/api/upload/route.ts`), repair commit, mirror rebuilt, parity proven — all BEFORE step-30 feature work. Recovery rule for future sessions: diff working tree vs recorded SHAs FIRST (see §3 sandbox process contract). |
| Uploaded files (`db/uploads/`) | ⚠️ Runtime data, NOT in the repo (gitignored by design) | Demo uploads are user data at runtime | Fresh clone starts empty; previously uploaded attachments recoverable **only by re-uploading**; purged notes delete their demo files server-side (v29). Cloud mode stores in Firebase Storage per-UID once that path goes live. |
| P3 cloud upload path | ⚠️ **Unverified** | No storage emulator; real Firebase project frozen | Owner-side Storage bucket + storage rules (Cloud-Go-Live backlog). Cloud purge deletes note docs but NOT Storage objects (v29 note, unchanged). |
| **N8 service worker (production honesty)** | ⚠️ Verified on localhost + manifest/icons; NOT verified in a real install | Lighthouse unavailable in the sandbox; real install needs a deployed HTTPS origin | The mechanical preconditions ARE live-verified (§7). On Cloud-Go-Live: run Lighthouse + a real device install; if the SW strategy ever changes, bump `savedbox-sw-vN`. |
| `.env` Firebase placeholders | ⚠️ Gitignored runtime config (NOT in the repo — by design) | Platform recycle emptied them once (step 28); re-added per the documented contract | If wiped again: append the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` per §3 (demo identifiers). Fresh environment recreates `.env` per §10 step 3. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; canonical sample via `POST /api/seed` (23/8/16). |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders only; production cloud persistence NOT verified (honest). |
| Emulator data | ⚠️ Ephemeral emulator state (untracked) | Runtime-only | Recreate anytime; not product data. |
| Dev server, emulator processes | ⚠️ Not persistent; platform reaps agent-spawned processes between tool calls; boot server died of OOM once (~1.9 GB next-server RSS vs ~4 GB cgroup) | Process state | `bun run dev`; single-session runbooks for all verification. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–4, both roadmaps, the ECC layer, and waves 6–8 N1–N8) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential — with the explicit exception of `db/uploads/` attachments (re-upload) and the gitignored `.env` (documented recovery). Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v30 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | Clean of tracked modifications at close-out (the v30 docs commit is the last commit; gitignored runtime noise may appear) — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` shows `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea` (frozen); **push blocked (no credential)**; unchanged at v30 |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — **REBUILT at the step-30 open (5th wipe)** + pushed + parity proven (repair + step-30 pushes; exact SHAs in worklog Step 30) |
| Local HEAD at v30 | see `git rev-parse HEAD`. Chain: … v28 `143b9ce`/`04fdd66` → v29 `15f66c7`/`9601980`/v29-amendment(`ea17f65`, object retained) → recycle re-hash `d582b81` → **step-30 repair commit `43ac7b0` (`fix: restore upload route…`)** → **step-30 feature commit `7b29f77` (`feat(n6,n7,n8): related notes, weekly resurfacing, installable pwa (retention wave)` — 34 files: 14 modified + 20 new incl. scorer/metrics/store/cards/manifest/sw/5 icons + runbook + roadmap checkboxes + 5 evidence pngs + 2 api-route folders)** → **step-30 docs commit `b9f3e46` (SNAPSHOT v30 + worklog + docs/ROADMAP.md)** → **v30 ledger amendment (the live HEAD)** — 40+ commits ahead of frozen origin |
| Phase status | **Roadmap #1: Phases 1–4 ✅, Phase 5 (P1) FROZEN. Roadmap #2: wave 6 CLOSED (N1+N2+N3 ✅); wave 7 N4+N5 ✅ (N10 ⏳ owner order); phase 8 N6+N7+N8 ✅ (this step); phase 9 ⏳ (N9 + G2 ruling + optional insights).** |

**Liveness checks (step 30):**

```bash
ls src/lib/related.ts src/lib/resurface-metrics.ts src/stores/resurface-store.ts src/app/manifest.ts public/sw.js scripts/verify-n678.sh   # → all exist
ls roadmaps/evidence/n6-*.png roadmaps/evidence/n7-*.png roadmaps/evidence/n8-*.png | wc -l   # → 7
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/manifest.webmanifest   # → 200 (server running)
ls skills | grep -c '^ecc-'   # → 11
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
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (roadmap #1) → `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (roadmap #2 — §7 checkboxes carry per-item DoD evidence) → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `AGENTS.md` → `docs/ECC-INSTALL.md` → `worklog.md`.
3. `bun install` · **create `.env`** (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + the 7 `NEXT_PUBLIC_FIREBASE_*` emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true` per §3/§8 — gitignored by design) · `bun run db:push`. `db/uploads/` starts empty (runtime data — §4 D-note).
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately (`POST /api/seed` → canonical 23/8/16, which includes 2 notes older than 30 days for the N7 card); cloud mode needs the emulator or real Firebase env.
5. **ECC skills:** a current `backup` clone already contains `skills/ecc-*`. If missing: re-clone ECC at commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b`, re-run the sweep + checksums per `docs/ECC-INSTALL.md`.
6. **Verification runbooks:** `scripts/verify-n345.sh` (step-29 features) and `scripts/verify-n678.sh` (step-30 features) each reproduce their full check matrix in ONE session. Remember the sandbox process contract (§3): run inside ONE tool call; after any session start, first diff the working tree against the SHAs recorded in §9 (the recycle pattern can re-hash commits and delete files — see §8 step-30 incident).
7. Resume from §1 "Next allowed step" / roadmap checkboxes (roadmap #1 phases 1–4 done; roadmap #2: waves 6 + 8 done, wave 7 has N10 pending; phase 9 + G2 ruling + P1 await the owner).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure.
2. **Full application build** (`be5caad`) + **Firebase integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → roadmap #1 (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1–QE7 + final regression.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7/S8/S1/S4/S3.
6. **Step 22 — G1 DONE.** SNAPSHOT v22.  7. **Step 23 — S5 DONE.** v23.  8. **Step 24 — S2 DONE (Phase 3 closes).** v24.  9. **Step 25 — ECC layer installed.** v25.  10. **Step 26 — PHASE 4 COMPLETE (S6+QE+P3).** v26.  11. **Step 27 — PRODUCT-STRATEGY ROADMAP REGISTERED (docs-only).** v27.
12. **Step 28 — WAVE 6 OPENED: N1 + N2 COMPLETE** (visible Inbox + JSON import; round-trip 100%; cloud pass; recycle repairs). Commits `dfa816a`/`143b9ce`/`04fdd66`. v28.
13. **Step 29 — N3 + N4 + N5 COMPLETE** (Persian search normalization+highlight; interactive dashboard; trash management) — 39/39 runbook; 2 real bugs fixed. Commits `15f66c7`/`9601980`/v29-amendment. v29.
14. **Step 30 — N6 + N7 + N8 COMPLETE (this step; phase 8 retention wave):**
    - **Environment repair FIRST (5th platform recycle):** amendment commit found re-hashed (`ea17f65`→`d582b81`) with `src/app/api/upload/route.ts` DELETED + backup mirror wiped → route restored from the retained object, repair commit, mirror rebuilt, parity proven before any feature work.
    - **N6 related notes:** shared pure scorer (`lib/related.ts`: tag×3/cat×2/type×1, real-connection threshold, ≤3, honest «بدون AI»); demo endpoint + cloud live-array path; sheet section that renders only on genuine connections; click swaps the sheet.
    - **N7 resurfacing v1:** recorded decision (oldest-first, no schema change); demo+cloud candidate paths; ONE dashboard card with «یکی دیگر»; persistent per-device toggle + Settings card with the honest click-rate KPI; zero external notifications.
    - **N8 installable PWA:** manifest route, AI-generated + PIL-derived icon set (incl. maskable), minimal network-first versioned SW + safe registration, layout metadata.
    - Quality: lint exit 0; tsc 0 under `src/`; 36/36 runbook checks; 7 evidence pngs; console errors 0. Demo DB re-seeded canonically at close-out. SNAPSHOT v30.

## 12. Remaining Work & Known State

- **Roadmap #2 (awaiting owner orders):** **N10 (duplicate detection on capture — wave-7 leftover)**; **N9 (SSRF-safe link enrichment — requires `ecc-security-review` at implementation time)**; the **G2 ruling** (AI / rule-based / none → `docs/DECISIONS.md`); optional insights. Roadmap #1's **Phase 5 P1 Telegram bridge (FROZEN)**. N6 gives N10 its scorer foundation (duplicate detection can reuse `lib/related.ts` + `normalizePersian`).
- **Cloud-Go-Live backlog:** P3 cloud upload verification; cloud purge does not delete Storage objects; password-reset link (QE7); composite-index pruning; optional server-side trash purge; **PWA hardening on the deployed origin (Lighthouse + real-device install; SW cache-name bump policy §3)**.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7); N10/N9/phase-9 orders; G2 ruling; P1 order.
- **Honest note (a) — N7 v1 semantics:** the card surfaces the OLDEST saves ≥30d; "never re-opened" tracking (a `lastOpenedAt` field in both modes) was deliberately deferred (owner-recommended v1). The Settings rate is therefore a click-through rate of the card, not a resurrection rate of "forgotten" items specifically.
- **Honest note (b) — N7 wrap-around:** «یکی دیگر» wraps after the pool end (≤10 candidates) instead of disabling — chosen for simplicity; a "no more" end-state would need pool-size signaling in the UI (trivial future tweak).
- **Honest note (c) — N6 ranking subjectivity:** weights (3/2/1) and the newest-first tie-break are product judgments recorded here; they are trivially tunable in ONE place (`lib/related.ts`).
- **Honest note (d) — N8 Lighthouse:** not run (no tooling in the sandbox); the verified preconditions are enumerated in §7. iOS: no programmatic install prompt (share-sheet "Add to Home Screen"), no custom splash beyond Apple's screenshot heuristics, SW storage subject to iOS eviction — documented here per the ordered card's honesty requirement.
- **Honest note (e) — N6/N7 cloud paths:** implemented per contract (live-array joins) but browser-verified in DEMO mode this step (same honest scoping convention as v28/v29; read-only joins introduce no new rules surfaces — reads are already owner-scoped).
- **Honest note (f) — step-30 recycle incident:** the 5th platform wipe re-hashed the v29 amendment commit and deleted the upload route; both repaired before feature work and recorded in §8/§11. FUTURE SESSIONS: always diff the working tree against the SHAs recorded in §9 first.
- **Lint (standing):** re-verified CLEAN at the step-30 close-out (exit 0). tsc noise: 3 pre-existing lines outside `src/` (unchanged).
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure".

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05 and re-issued verbatim with every step order (latest: step 30): after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump v30 + date).
2. [x] Affected reference docs updated: `roadmaps/PRODUCT-STRATEGY-ROADMAP.md` (N6/N7/N8 checkboxes + DoD evidence + recorded decisions + §8 persistence state), `docs/ROADMAP.md` (strategy-wave execution status), `worklog.md`. Scope honesty: `docs/DECISIONS.md` unchanged (no new ruling — the step executed an existing owner order; the N7-v1/N6-honesty/N8-honesty policies are implementation decisions recorded in §4), `docs/CHANGELOG.md`/`docs/ENVIRONMENT.md` unchanged (no Brief delta).
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA (§9; SHAs in worklog Step 30).
4. [x] `git status` reviewed before commit — feature files + runbook + icons/manifest/sw + roadmap + 7 evidence pngs staged and verified exclusive; nothing essential left in temp locations (`tool-results/` gitignored; `/tmp` probe files ephemeral and reproducible per §7).
5. [x] Commit with a descriptive message (recycle-repair commit + feature commit + docs commit + ledger amendment).
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method (incl. the gitignored `.env` contract). Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer, Phase 4, both roadmaps and waves 6–8 N1–N8) today — except `db/uploads/` attachments and the gitignored `.env` (both documented with recovery methods above); true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
