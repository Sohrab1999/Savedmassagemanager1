# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 18 · **Date:** 2026-11-05 · **Snapshot author:** Z.ai Code agent
> **v8 note:** full rewrite — previous version (v7) predates the entire application build and was severely outdated. This version describes the real, current product.
> **v18 status: PHASE 2 IN PROGRESS — S7 ✅ + S8 ✅ + S1 ✅ (all verified, S1 live on the emulator at 600 items).** Next: S4 → S3.

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Feature upgrade plan | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. Produced per owner's 11-section analyst mandate (12 live screenshots in `roadmaps/evidence/01…12` + full code re-read). Phases 1–5 with checkboxes, DoD per item, priority scoring, Keep/Change/Remove. |
| **Current gate** | **Roadmap Phase 2 — Data Foundation Repair IN PROGRESS (owner order 2026-11-05; S7 + S8 + S1 done).** Phase 1 (QE1–QE7) completed and signed off. After each step: full SNAPSHOT update + commit + push + SHA-parity proof. |
| Development status | **Full application implemented and running** (see §2). **Roadmap Phase 2 in progress (S7+S8+S1 done).** |
| Next allowed step | Phase 2 remaining: **S4** (title/content editor UI in detail Sheet) → **S3** (filters in URL hash: deep-link + refresh + back/forward). Evidence: Phase-1 `roadmaps/evidence/qe*.png`; Phase-2 `s7-*.png`, `s1-*.png` (S8 was emulator-probe-based). |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up, honest "continue in demo mode" entry, emulator badge, not-configured fallback (this deployment has no real Firebase env → cloud sign-in explicitly declared unavailable; demo mode offered).
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, 4 stat cards, category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: search (300 ms debounce), filter toolbar (**QE2 (v10): split into scrollable chip zone + always-visible stable segment** holding sort & grid/list toggle — reachable without horizontal scroll @1280px & @390px, RTL+LTR verified), type/favorite/archived/category/tags filters, **QE5 (v13): active-filters bar** above results — one removable chip per active filter (q/type/category/tags/favorite/archived) + live Persian-digit counter + clear-all; hidden entirely when nothing is set; type-aware note cards, loading/empty/no-results/error states.
  - **Categories**: category CRUD dialog (name/nameFa/icon/color) + tags tab (create/filter/delete); **QE3 (v11): category cards are clickable** (`setFilters({categoryId}) + setView('library')`, same affordance as dashboard tiles), keyboard-accessible (role=button + Enter/Space), ⋯ menu isolated via stopPropagation; new i18n keys `a11y.openCategory` (fa+en).
  - **Settings**: profile, theme, language, JSON export, demo-data reset (demo-mode only, honestly scoped), environment/about.
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types (text/link/image/video/file), title/content/url/mediaUrl, category, comma-separated tags (fa+en comma); **QE6 (v14): error-prevention save flow** — unified `saveDisabledReason` (title / text-content / link-URL) drives the save button's disabled state + `title` attr + a visible dynamic hint (`role=status`) under the title field; static `capture.titleHint` when form valid; verified end-to-end for text & link types (3 test saves via UI, then deleted via API — demo data restored to 21 visible items).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing (persisted), tag add/remove via datalist, favorite/archive/delete (confirm), open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, category chip; **QE1 (v9): list rows show snippet AND relative saved-date together (date pinned to row end, logical `ms-auto`); verified fa-RTL + en-LTR @1280px and no-overflow @320px (`roadmaps/evidence/qe1-after-*.png`).** **QE4 (v12): shared `TagChips` component renders up to 2 tag chips + Persian-digit `+N` overflow on grid cards (between snippet and meta row) and list rows (below snippet line); renders null when note has no tags (no layout shift); verified incl. +۱ path (`roadmaps/evidence/qe4-*.png`, demo data reseeded after the +N probe).**
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository (`src/services/repository.ts`, per-UID `users/{uid}/…`); else → demo API over Prisma/SQLite (sample data, honestly labeled).
- **S7 read consolidation (v16, Cloud repository):** session **notes snapshot** — `getNotesSnapshot()` (module memory, TTL 60 s, in-flight dedup, invalidated by every write) feeds `getStats`, `listCategories`, `listTags`, and `updateCategory` note-counts. Read accounting (Cloud, code-level): before = dashboard 2 full downloads / library mount 3; after = **≤ 1 per view combination per 60 s window**. Live Network-panel proof requires the frozen Firebase env (§8). `useInvalidateNotes` also invalidates `categories`/`tags` now (note mutations change their counts).
- **S8 batched writes (v17, Cloud repository):** `batchedUpdate` (chunked writeBatch, 500 ops/chunk) powers all three fan-outs (category rename/delete, tag delete with `arrayRemove`); `resolveTagRefs` = one `where(name in names)` query (≤30, matching the rules' tag cap) + missing tags created in ONE batch (`batchedCreateTags`, client-allocated IDs). **Emulator-verified:** rename 60-note category = 1 batch commit, 60/60 updated, 0 stale; tag resolve + tag-delete fan-out probes PASS; `scripts/rules-test.ts` **39/39 green** on the same emulator.
- **S1 server-side pagination (v18, both modes):** contract `{items, total, nextCursor}` + `pageToken/pageSize`; demo = Prisma skip/take+count (silent `take:300` removed); cloud = **structured path** (`where/orderBy/limit(30)/startAfter` docRef-cursor + `getCountFromServer` exact total) when no q/tag filter, **snapshot path** (shared S7 full read + client filterAndSort, offset pages) for q/tags — exact semantics both paths; `fetchAllNotes` and the 500 cap are **gone from the codebase**. UI: `useInfiniteQuery` + Load more button (fa/en). **Verified live:** demo @623 items (search 79 exact, last page 5+null cursor) and **cloud @601 items on the emulator** (counter ۵۵۵ exact, cursor paging, matrix link=111/fav=50/title-ASC matches demo & REST ground truth; a real title-DESC divergence was found and fixed; duplicate React keys from `placeholderData` fixed). `rules-test.ts` 39/39. `firestore.indexes.json`: 11 composite indexes declared for production. Scale seeding: `POST /api/seed {extraNotes≤1000}` (default 0).
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts` (env-driven init, Auth :9099 / Firestore :8080 hooks), `firestore.rules` (owner-only writes, field validation, catch-all deny), `firestore.indexes.json`, `scripts/rules-test.ts` (**39/39 pass**), `scripts/e2e-verify.sh` (**15/15 browser E2E pass**).
- **i18n/RTL**: type-safe flat dictionaries fa+en (`src/lib/i18n/dictionaries.ts` — fa is the default), `dir` synced to locale, Persian digits via formatters, Vazirmatn font.
- **Platform compliance**: single user-visible route `/` (`src/app/page.tsx`); API routes under `src/app/api/**` (demo data source); sticky-footer layout rules; shadcn/ui New York components only.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route: `/`. API routes (`src/app/api/**`), not server actions.
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties (`ps/pe/ms/me/start/end`) mandatory; no indigo/blue unless owner asks; responsive mobile-first; sticky footer (`min-h-screen flex flex-col` + footer `mt-auto`).
- **Data (dual-mode):** authenticated = Firestore per-UID; unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`; `.env` `DATABASE_URL=file:/home/z/my-project/db/custom.db` + **Firebase emulator placeholders (restored v18)** — demo project `demo-savedbox`, emulator-only, no production credentials). **S1 (v18): notes list is paginated (30/page) in BOTH modes; the 500 cap no longer exists anywhere; cloud q/tag filtering runs over the shared uncapped S7 snapshot (Firestore web SDK has no substring search; documented in repository.ts header).**
- **Firebase Emulator Suite is runnable in-sandbox and was used for LIVE cloud-mode verification (v18):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). With `.env` placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true`, the app signs in against the emulator (real cloud mode). Bulk test data via Firestore REST `:commit` with `Authorization: Bearer owner` (emulator rules bypass; document names must be full `projects/…/documents/…` paths). Probe scripts live in `tool-results/` (gitignored) — the owner's no-test-code rule is honored (nothing committed).
- **State:** Zustand (`src/stores/app-store.ts` — view/detailNoteId/captureOpen/filters) + TanStack Query (`src/hooks/queries.ts` — UID-scoped keys, dispatch through data-source).
- **Firebase:** env-driven (`NEXT_PUBLIC_FIREBASE_*`); emulator flag `NEXT_PUBLIC_FIREBASE_EMULATOR=true`. UID always derived from verified Auth state inside repository, never from callers. **Never store credentials in the repo.** Emulator Suite runnable in-sandbox: `bunx firebase-tools emulators:start --only auth,firestore` (Auth :9099, Firestore :8080, UI :4000; first-run JAR cached in `~/.cache/firebase/emulators/`).
- **i18n:** add every new UI string to BOTH `en` and `fa` in `src/lib/i18n/dictionaries.ts` (type-checked parity); use `t()`; Persian digits via `formatNumber`/`formatDate`/`formatRelativeTime` (`src/lib/format.ts`).
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); single external port via Caddy (`?XTransformPort=`) — not used by this app so far.
- **Phase-1 constraint:** Quick Wins must not change architecture (no query-model, batching, or data-layer redesign — those are Phase 2 S1/S7/S8).

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 (dark-mode scope) PENDING — factual check recorded (brief lists Light/Dark).
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; scheduled for Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — Phase 2.
- **Owner mandate 2026-11-05 (this session, binding):** execute roadmap Phase 1 Quick Wins; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance criterion = fresh-clone recoverability without chat history. See §Protocol.

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO` (type text|link|image|video|file, title, content, description, url, mediaUrl, fileName, fileSize, mediaDuration, sourceChat, sourceType manual|telegram, categoryId+category ref, tags ref[], isFavorite, isArchived, savedAt, updatedAt), `CategoryDTO` (slug, name, nameFa, icon, color, order, noteCount), `TagDTO` (name, noteCount), `StatsDTO`, `ProfileDTO`, `NoteFilters`, `CreateNoteInput`/`UpdateNoteInput` (title/content updatable server-side — UI editor arrives in Phase 2 S4).
- **Demo mode:** Prisma/SQLite (`prisma/schema.prisma` — Note/Category/Tag/NoteTag/Profile), sample data seeded.
- **Cloud mode:** Firestore docs per `src/domain/types.ts` (NoteDoc/CategoryDoc/TagDoc/ProfileDoc) under `users/{uid}/…`.

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.11.1, **firebase ^11 (auth + firestore)**, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner (toasts), lucide-react, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`.

## 7. Tests & Quality Status

- **Owner rule: no test code.** `scripts/rules-test.ts` (Firestore rules assertions, 39/39) and `scripts/e2e-verify.sh` (browser E2E, 15/15) are verification scripts from the Firebase phase, run on demand against the emulator.
- **Lint:** `bun run lint` CLEAN at snapshot v8 baseline AND after every Phase-1 step (QE1–QE7 + final close-out); last run at v15: clean.
- **Type check:** app code tsc clean at Firebase-phase completion.
- **Browser verification (mandatory per step):** agent-browser at 1280px + 390px, fa RTL + en LTR; Phase-1 evidence PNGs stored under `roadmaps/evidence/qe*.png`. **FINAL PHASE-1 REGRESSION (2026-11-05, clean):** all 4 views render (dashboard/library/categories/settings) with 0 `[role=alert]` errors; list view 21/21 rows carry dates; mobile @390 no page overflow + layout toggle in view; `dev.log` free of errors/warnings. Per-item evidence: QE1 fa-RTL@1280 ✓ + en-LTR@1280 ✓ + @320px no-overflow ✓; QE2 toggle in viewport @1280/@390 both languages + before/after shots ✓; QE3 card-click navigation + ⋯ isolation + keyboard ✓; QE4 chips grid+list + geometry + +۱ overflow ✓; QE5 hidden-by-default/sync/remove/clear-all ✓; QE6 causal disable for text & link first-save journeys ✓.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed from sandbox and store emptied; owner must revoke old PAT and issue a fine-grained PAT (this repo, Contents: R/W). Re-tested 2026-11-05: `git push --dry-run origin main` → `could not read Username` (no env token, no `~/.git-credentials`, no netrc, upload/ empty). | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL local commits (including every Phase-1 step) are already committed and queued on `main`, so ONE push syncs everything. Until then, GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` — the ENTIRE Savedbox app, Firebase integration, this roadmap, SNAPSHOT v8, all Phase-1 commits — exists **only in this sandbox + the local `backup` mirror** until the owner pushes. This is the single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ **RECREATED 2026-11-05** (`/home/z/my-project-backup.git`, fresh `git init --bare`) — was destroyed by the earlier platform rollback | Same-filesystem only | Survives project-dir loss, NOT total sandbox destruction. Pushed every step; parity proven via `git ls-remote backup`. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB (demo sample + any demo edits) | Recreated by `bun run db:push` (empty schema) — demo sample data reseeded by API; not product data loss (cloud mode holds real data). |
| Real-Firebase env values | 🚫 Not present | Owner's Firebase console values never supplied to sandbox | Emulator placeholders in `.env`; production cloud persistence NOT verified (honest per Firebase-phase report). |
| Dev server, emulator processes | ⚠️ Not persistent | Process state | `bun run dev`; `bun run emulators` for Firebase suite. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`** (docs phase). Everything after that is recoverable only from this sandbox (local disk + `backup` mirror). **The gap is caused by the absent push credential, which only the owner can supply; every local commit is queued and push-ready.** No false parity claims are made.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v8 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | clean at last check |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` 2026-11-05: `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`; **push blocked (no credential)** |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — **recreated 2026-11-05**; pushed + parity proven every step |
| Local HEAD at v18 | see `git rev-parse HEAD`; chain: Phase 1 `…`→`803dfae` → S7 `6273298` → S8 `4bf21a2` → **S1 commit (see live rev-parse)** — 17+ commits ahead of frozen origin |
| Phase status | **Phase 1: ✅ COMPLETE. Phase 2: S7 ✅ S8 ✅ S1 ✅ — S4/S3 pending** (each step = own commit, backup parity proven at commit time) |

Authoritative live check:

```bash
git rev-parse HEAD && git status --short \
 && git ls-remote backup refs/heads/main \
 && GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=true git -c credential.helper= ls-remote https://github.com/Sohrab1999/Savedmassagemanager1.git refs/heads/main
# backup/main must equal local HEAD; origin read anonymously shows its true (frozen) state.
```

## 10. Recovery Procedure (fresh environment, no chat history)

1. `git clone https://github.com/Sohrab1999/Savedmassagemanager1.git my-project` (public read; ⚠️ recovers only to `e5898b2` until owner pushes — then fully current).
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `worklog.md`.
3. `bun install` · `.env` (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + `NEXT_PUBLIC_FIREBASE_*` emulator placeholders or real values) · `bun run db:push`.
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately; cloud mode needs Firebase env (or `bun run emulators`).
5. Resume from §1 "Next allowed step" / roadmap checkboxes.

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (UI Pro Max, Impeccable) — E1/E2.
2. Product Brief v1.0 → full PM audit (C/M/AD/D lists).
3. Persistence Protocol established; docs/ persisted; `backup` mirror + parity proof.
4. D1–D12 approved → Brief v1.1; D14–D16 + binding instructions → Brief v1.2; Phase 0 checklist created (DRAFT).
5. D13: GitHub `origin` configured; full history pushed; parity independently re-verified anonymously; security closure (credential removed; push blocked pending owner PAT).
6. **Full application build** (`be5caad`): Savedbox — 4-view IA, capture/library/detail/categories/settings, fa-default i18n/RTL, dual-mode demo API.
7. **Firebase Auth + Firestore integration** (`e214a98`): per-UID repository, rules 39/39, browser E2E 15/15 (emulator-verified), honest config status.
8. **Feature X deep analysis** (2026-11-05): 12 live screenshots + full code re-read → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (11-section analyst template, phases 1–5, scoring, Keep/Change/Remove).
9. **Phase 1 Quick Wins started** (owner mandate 2026-11-05): baseline evidence captured (`roadmaps/evidence/qe2-before-*.png` @1280/390px — confirms filter-bar overflow findings); `backup` mirror recreated after rollback destruction; SNAPSHOT rewritten to v8; lint baseline clean.
10. **QE1 done (step 9):** list-row date restored — `note-card.tsx` list layout now renders snippet + relative date together (`ms-auto` end-pin, no-overflow); verified fa-RTL/en-LTR@1280 + @320px (`roadmaps/evidence/qe1-after-fa-1280.png`, `qe1-after-en-1280.png`, `qe1-after-en-320.png`); SNAPSHOT v9; lint clean; committed & backup parity proven.
11. **QE2 done (step 10):** library filter toolbar split — sort select + grid/list toggle moved OUT of the horizontal-scroll chip zone into an always-visible stable segment (flex `min-w-0 flex-1` chips area + `shrink-0` controls, no new i18n keys, no architecture change); verified @1280 & @390 fa-RTL + en-LTR (bounding-box in viewport, pageOverflowX=false); before/after evidence `roadmaps/evidence/qe2-*.png`; interaction regression passed (list toggle + QE1 dates intact); SNAPSHOT v10; lint clean; committed & backup parity proven.
12. **QE3 done (step 11):** category cards in Categories view made clickable — same affordance as dashboard tiles (`setFilters({categoryId}) + setView('library')`); keyboard accessible (role=button + tabIndex + Enter/Space); ⋯ menu isolated (`stopPropagation` on trigger; menu items live in portal, unaffected); new dictionary keys `a11y.openCategory` fa+en; verified in browser: click → `#/library` filtered ("۳ مورد"), ⋯ opens without navigation, Enter-key navigates; SNAPSHOT v11; lint clean; committed & backup parity proven.
13. **QE4 done (step 12):** `TagChips` added to `note-card.tsx` (shared by grid + list) — max 2 tag chips + `+N` (Persian digits via `formatNumber`), null-render when untagged (no layout shift); verified visually + geometrically (RTL anchoring) + `+۱` overflow path (temp 3-tag probe, demo data reseeded via `POST /api/seed`, tags restored); SNAPSHOT v12; lint clean; committed & backup parity proven.
14. **QE5 done (step 13):** active-filters bar replaced the tag-only chip section — `ActiveFilterChip` component + bar with per-filter removable chips (q with «quotes», type, category/none, tags, favorite, archived), live counter (Persian digits), clear-all (`resetFilters`); hidden when no filters; new i18n keys `library.activeFilters.count`, `a11y.removeFilter` (fa+en); verified: hidden-by-default ✓, 2-chip + "۲ فعال" state ✓, single-chip removal → "۱ فعال" ✓, clear-all → hidden + ۲۱ مورد ✓ (`roadmaps/evidence/qe5-active-filters.png`); SNAPSHOT v13; lint clean; committed & backup parity proven.
15. **QE6 done (step 14):** capture save flow made error-preventing — unified `saveDisabledReason` (title→text-content→link-URL) drives disabled state + causal `title` attr + visible dynamic hint (`role=status`) under title; static upfront hint `capture.titleHint` (fa+en) when valid; verified full first-save journeys for text and link types (button states at each stage + success toasts, `qe6-capture-hint.png`/`qe6-after-save.png`); 3 UI-created test notes deleted via API afterwards (demo library back to 21 visible items); SNAPSHOT v14; lint clean; committed & backup parity proven.
16. **QE7 + PHASE 1 CLOSE-OUT done (step 15):** QE7 — password-reset link registered as a blocker in a new **“Cloud-Go-Live backlog”** section of `docs/ROADMAP.md` (execution only after the owner enables the Email provider in the real Firebase project); roadmap file — all Phase-1 checkboxes ticked with completion annotations + §9 protocol section updated (backup recreated per-step parity; origin push still blocked, all commits queued); **final full-app regression** — all 4 views 0 errors, 21/21 list rows with dates, mobile 390px no overflow + toggle in view, dev.log clean; SNAPSHOT v15; lint clean; committed & backup parity proven.
17. **Phase 2 opened + S7 done (step 16, owner order):** persistence debt cleared first (`backup` mirror rebuilt + parity `803dfae`; mode-flip noise restored); S7 — `getNotesSnapshot()` shared session snapshot (TTL 60 s + in-flight dedup + write-invalidation) now feeds `getStats`/`listCategories`/`listTags`/updateCategory-noteCount (read accounting: library mount 3→1 downloads, dashboard 2→1); `useInvalidateNotes` extended to categories/tags; live demo regression clean (dashboard/categories/library, `s7-*.png`); SNAPSHOT v16; lint clean; committed `6273298` & backup parity proven.
18. **S8 done (step 17, emulator-verified):** all three fan-outs → chunked `writeBatch` (`batchedUpdate`, 500 ops/chunk); `resolveTagRefs` → one `in` query + batch tag creation (`batchedCreateTags`); live probes on the Firebase Emulator: 60-note category rename = 1 batch commit 60/60 updated 0 stale, tag resolve + tag-delete PASS; `rules-test.ts` 39/39 green; demo regression clean; SNAPSHOT v17; lint clean; committed `4bf21a2` & backup parity proven.
19. **S1 done (step 18, the phase's core):** paginated notes (30/page) in both modes; `fetchAllNotes` + 500-cap deleted; cloud structured path (where/orderBy/startAfter + `getCountFromServer`) + snapshot path for q/tags; `useInfiniteQuery` + Load-more UI; title-sort divergence (cloud DESC vs demo ASC) found & fixed; `placeholderData` removed (duplicate-key fix); verified demo @623 + **cloud @601 live on emulator** (full matrix); rules 39/39; 11 composite indexes declared; demo seed restored; SNAPSHOT v18; lint clean; committed & backup parity proven.

## 12. Remaining Work

- **Phase 2 (in progress):** S7 ✅ S8 ✅ S1 ✅ → **S4** (title/content editor UI, persist after refresh) → **S3** (filters in URL hash: deep-link + refresh + back/forward).
- **Phases 3–5:** G1 realtime+offline, S5 undo-delete, S2 capture unification; then S6 bulk ops, tag typeahead, G2 AI assist (separate decision), P3 real file upload; P1 Telegram bridge FROZEN until explicit owner order.
- **Cloud-Go-Live backlog:** password-reset link (QE7) — blocked on real Firebase Email provider (`docs/ROADMAP.md`).
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — all Phase-1 work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7).

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [ ] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump + date).
2. [ ] Affected reference docs updated: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/ENVIRONMENT.md`, roadmap file, `worklog.md`.
3. [ ] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA.
4. [ ] `git status` reviewed before commit — no essential file left untracked/unstaged; nothing essential only in temp locations.
5. [ ] Commit with a descriptive message.
6. [ ] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [ ] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [ ] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror) today; true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
