# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 24 · **Date:** 2026-11-05 · **Snapshot author:** Z.ai Code agent
> **v8 note:** full rewrite — previous version (v7) predates the entire application build and was severely outdated. This version describes the real, current product.
> **v24 status: ROADMAP PHASE 3 COMPLETE — G1 ✅ + S5 ✅ + S2 ✅, all DoD-verified (demo + live Firebase Emulator, fa/en, 1280/390). Phases 4–5 await the owner's order.**
> **v23 provenance note (honesty):** the S5 code + cloud evidence had already been committed inside `806d717` (bundled with G1; its message mentions only G1). Step 23 added the fresh demo-mode DoD verification, evidence review and documentation — recorded so the ledger matches reality.

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | **Savedbox** (ذخیره‌خانه) — Telegram Saved-Messages organizer / personal knowledge manager, "Capture First, Organize Later" |
| Brief | v1.2 APPROVED (`docs/PRODUCT_BRIEF.md`; v1.0 archived; deltas in `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | D1–D12, D13, D14–D16 APPROVED; five owner binding instructions; D17 pending (`docs/DECISIONS.md`) |
| Feature upgrade plan | **`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` v1.0** (2026-11-05) — Feature X = Capture → Library → Detail core. Produced per owner's 11-section analyst mandate (12 live screenshots in `roadmaps/evidence/01…12` + full code re-read). Phases 1–5 with checkboxes, DoD per item, priority scoring, Keep/Change/Remove. |
| **Current gate** | **Roadmap Phase 3 — Experience Leap: COMPLETE (owner order).** G1 ✅ (step 22) · S5 ✅ (step 23) · S2 ✅ (step 24) — all DoD-verified. **Phases 4–5 (S6 bulk ops, tag typeahead, G2 AI assist, P3 real file upload) await the owner's order.** After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Development status | **Full application implemented and running** (see §2). **Phases 1–3 COMPLETE.** |
| Next allowed step | **Await owner's order for Phase 4** (S6 bulk ops, QE-tagging typeahead, G2 AI assist = separate decision, P3 real file upload; P1 Telegram bridge FROZEN). KPI فاز ۳: cross-device visibility (cloud push, verified qualitatively in G1) + undo-rate recorded & reported (S5). Evidence: `roadmaps/evidence/g1-*.png` (5), `s5-demo-*.png` (5), `s5-cloud-*.png` (4), `s2-*.png` (5), plus P1/P2 sets. |

## 2. Implemented Capabilities

**Full dual-mode product, running on `bun run dev` (port 3000):**

- **Auth gate** (`src/components/app/auth-gate.tsx` + `src/hooks/use-auth.tsx`): email/password sign-in & sign-up, honest "continue in demo mode" entry, emulator badge, not-configured fallback (this deployment has no real Firebase env → cloud sign-in works against the LOCAL Emulator Suite; production values absent).
- **Four-view IA with hash navigation** (`#/dashboard`, `#/library`, `#/categories`, `#/settings`; deterministic SSR view, hash re-synced post-hydration — `src/stores/app-store.ts`):
  - **Dashboard**: greeting, quick-capture banner, 4 stat cards, category tiles (click → filter library), type distribution bars, recent items.
  - **Library**: search (300 ms debounce), filter toolbar (QE2), type/favorite/archived/category/tags filters, QE5 active-filters bar, **S1 (v18): paginated results — 30/page + «نمایش بیشتر / Load more ({n} remaining)»**; **S3 (v20): filters in the URL hash** `#/library?q=…&type=…&cat=…&tags=…&fav=1&arch=1&sort=…` (deep-link/refresh/back-forward verified); layout stays device-local.
  - **Categories**: category CRUD dialog + tags tab (create/filter/delete); QE3 clickable category cards (keyboard-accessible, ⋯ isolated).
  - **Settings**: profile, theme, language, JSON export, demo-data reset (demo-only), environment/about.
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types, title/content/url/mediaUrl, category, comma-separated tags; **QE6 (v14): error-prevention save flow** (causal disabled-state hint).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing, **S4 (v19): title/content editing** (pencil → Input+Textarea, causal disabled save, persists in BOTH modes); tag add/remove via datalist, favorite/archive/delete (confirm), open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, category chip; QE1 list rows (snippet + relative date, `ms-auto`); QE4 shared `TagChips` (max 2 + Persian `+N`).
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API over Prisma/SQLite (sample data, honestly labeled).
- **G1 REALTIME + OFFLINE (v22, the phase-3 core, Cloud mode):**
  - **`src/services/firebase.ts`** initializes Firestore with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` — IndexedDB persistence (browse offline, queued writes reconcile on reconnect) + multi-tab coordination. Fallbacks: SSR → `getFirestore`; HMR re-init → existing instance; IndexedDB blocked → `memoryLocalCache`. DEV-ONLY debug hook `window.__savedboxFirestore.{goOffline,goOnline}` (emulator builds only).
  - **`src/services/realtime.ts` (NEW)** — `realtimeStore`: THREE permanent uncapped `onSnapshot` listeners per UID (notes/categories/tags) replacing EVERY one-shot read; exposes live arrays + `ensureReady()` + `subscribe`/version + `getNoteById` + `mapNote`; includes the S5 7-day trash purge (batched, once per session).
  - **`src/services/repository.ts`** — reads derive from the live store (listNotes = 30-page presentation over the full local array; stats/categories/tags = joins; loadCategoryRef/resolveTagRefs live-first with getDoc fallbacks). The S1 structured-query path is DELETED (superseded — guarantees preserved: uncapped, exact totals, demo-parity sorts). Fan-outs target the live array → read-free and UNCAPPED (MAX_NOTES_FETCH=500 lookup cap gone).
  - **`src/components/app/app-shell.tsx`** — realtime bridge: start on sign-in, coalesced (50 ms) `queryClient.invalidateQueries()` on every snapshot, full teardown on unmount/UID change/sign-out. Single component-level listener → no unmount leak.
  - **`src/hooks/queries.ts`** — demo mode polls every 2 s (notes/stats/categories/tags, active tab only); cloud never polls.
  - **DoD verified live (2026-11-05):** second-device REST write appears without refresh; tab2-UI-write → tab1 without refresh; browser-offline write survives reload and syncs on reconnect; SDK-offline: cache browsing + local latency-compensation display + server stays stale until `goOnline()` then syncs. Evidence: `roadmaps/evidence/g1-*.png` (5 files). Rules 39/39 after `deletedAt` whitelist.
- **S2 CAPTURE UNIFICATION (v24, demo DoD verified live):**
  - **`src/components/app/tag-chips-input.tsx` (NEW, the shared component):** ONE tag-entry UX for quick capture AND the note detail sheet — chips (Badge + per-chip remove `aria-label`), inline field commits on Enter/`,`/`،` (immediate commit when a separator is typed; paste "a,b" → two chips), Backspace-on-empty removes the last chip, **commit-on-blur never loses a draft tag on Save**, exact-match dedup, existing tags as `datalist` suggestions; Input-look container (focus ring), RTL-safe.
  - **Paste-link detection:** pasting a bare URL into quick-capture's title → intercepted (`preventDefault`, title stays clean) → form auto-converts to type=link + URL filled + status hint «لینک شناسایی شد…»; QE6 precedence preserved (empty-title save-blocker wins until a title exists).
  - **Detail sheet:** tag mutation simplified to one list-based `patchNote({tagNames})` (both backends auto-create missing tags: demo `connectOrCreate`, cloud `resolveTagRefs`) — removed the two-step create-then-patch and its stale-closure race.
  - Verified: paste-link fa+en; add/remove chips both paths; persistence across sheet close/reopen; ASCII+Persian comma commit; mobile @390 no overflow; final 4-view sweep clean (0 console/page errors).
- **S5 UNDO DELETE (v23, demo DoD verified live):**
  - **Soft delete end-to-end:** `deleteNote` sets `deletedAt` (never hard-deletes immediately); restore clears it. Demo: `server/services/notes.ts` + `POST /api/notes/[id]/restore`; cloud: repository `updateDoc({deletedAt})`. 7-day auto-purge: demo `deleteMany` on every list; cloud batched client-side sweep in `realtimeStore` (once per session).
  - **Trash UX:** delete-confirm dialog honestly says «به سطل منتقل می‌شود و تا ۷ روز قابل بازیابی است»; success toast «به سطل منتقل شد» with the **«بازگردانی» action (7 s window, sonner)**; trashed note's detail sheet shows «بازگردانی از سطل»; library toolbar has the «سطل» chip (mutually exclusive with archived; active-filter chip removable; deep-link `trash=1` via the S3 hash); trash excluded from default lists/stats/categories/tags in BOTH modes.
  - **Undo-rate KPI:** `src/lib/undo-metrics.ts` (per-device localStorage) shown in Settings → About («نرخ بازگردانی حذف‌ها») — live test recorded «۱ از ۱ (۱۰۰٪)».
  - Verified: delete → trash(1) → restore-from-trash → full restore (21→20→21); cloud evidence (emulator) reviewed: `s5-cloud-*.png` (4).
- **S7→S8→S1→S4→S3 (Phase 2, v16–v20) remain in force**, with two G1-era updates: (a) the S7 TTL snapshot and S1 cloud structured path were REPLACED by the G1 live store (read accounting now = exactly 1 uncapped listener per session, zero per-view downloads); (b) fan-outs no longer have the 500-note lookup cap.
- **Firebase integration (emulator-verified)**: `src/services/firebase.ts`, `firestore.rules` (owner-only, field validation incl. optional `deletedAt`, catch-all deny), `firestore.indexes.json`, `scripts/rules-test.ts` (**39/39 pass** on the updated rules), `scripts/e2e-verify.sh` (15/15 at Firebase-phase time).
- **i18n/RTL**: type-safe flat dictionaries fa+en (`src/lib/i18n/dictionaries.ts` — fa default), `dir` synced, Persian digits, Vazirmatn.
- **Platform compliance**: single user-visible route `/`; API routes under `src/app/api/**`; sticky-footer rules; shadcn/ui New York only.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route: `/`. API routes (`src/app/api/**`), not server actions.
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties mandatory; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore` (repository starts it idempotently and awaits `ensureReady()`); UI pagination is presentation over the full local set; demo list remains server-paginated (30/page) with 2 s polling.**
- **Firebase Emulator Suite (running in-sandbox for cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). `.env` has emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true`. Bulk data via Firestore REST `:commit` with `Authorization: Bearer owner`; REST field encoding gotcha: nullable strings MUST be `{"nullValue": null}` (not `{"stringValue": null}`). Probe UID (this session): `94ZKYTmgH7xJibbkfR0RUY7vPDDT` (`tool-results/g1-probe-uid.txt`, untracked).
- **State:** Zustand (view/detailNoteId/captureOpen/filters) + TanStack Query (UID-scoped keys; invalidations from mutations AND the realtime bridge).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa` (`src/lib/i18n/dictionaries.ts`); `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e scripts are verification scripts run on demand.
- **Phase-3 note:** G1 intentionally supersedes S1's cloud structured-query path (documented in repository.ts header) — the owner's roadmap orders realtime as the replacement of one-shot reads.

## 4. Product Decisions State

- D1–D12 (product) APPROVED 2026-11-04; D14–D16 final rulings APPROVED; D13 (GitHub backup) APPROVED & DONE; D17 pending.
- A1–A8 assumptions UNRESOLVED (silence ≠ approval; Phase 0 W7 review).
- AD1–AD12 architecture decisions OPEN — addressed per phase as implemented.
- **Owner mandate 2026-11-05 (binding, re-issued with Phase 2/3 orders):** execute roadmap phases; after **every** step, full SNAPSHOT refresh + reference-doc updates + commit + push + `ls-remote` parity proof; acceptance = fresh-clone recoverability without chat history. «صرفاً نوشتن Snapshot کافی نیست» — snapshot, docs, commit AND push must each be evidenced.

## 5. Data Structure

- **Shared DTOs** (`src/lib/domain/types.ts`): `NoteDTO` (…, isFavorite, isArchived, **deletedAt: string | null (S5, active)**, savedAt, updatedAt), `CategoryDTO`, `TagDTO`, `StatsDTO`, `ProfileDTO`, `NoteFilters` (+ **`trash?: boolean` (S5, active)**, pageToken/pageSize), `CreateNoteInput`/`UpdateNoteInput`, `NoteListResponse`.
- **Demo mode:** Prisma/SQLite (`prisma/schema.prisma` — Note/**`deletedAt DateTime?` + `@@index([deletedAt])`**/Category/Tag/NoteTag/Profile), sample data seeded (21 visible items default).
- **Cloud mode:** Firestore docs per `src/domain/types.ts` (NoteDoc/**`deletedAt?: number | null`**/CategoryDoc/TagDoc/ProfileDoc) under `users/{uid}/…`; rules whitelist `deletedAt` (null | epoch-ms, ≤ now+1d skew).
- **S5 semantics (active):** `deletedAt = null` → normal views; non-null → trash view only; hard delete after 7 days in trash (demo `deleteMany` per list; cloud batched sweep per session). API list param `trash=true` (`=== "true"` parse — `trash=1` is NOT accepted by the API; the UI hash uses `trash=1` and maps to `true`).

## 6. Dependencies

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), **firebase ^11 (auth + firestore; persistentLocalCache/persistentMultipleTabManager in use)**, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner (toasts), lucide-react, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`.

## 7. Tests & Quality Status

- **Owner rule: no test code.** `scripts/rules-test.ts` (Firestore rules assertions — **39/39 PASS after the G1 rules change**) and `scripts/e2e-verify.sh` (15/15 at Firebase-phase time) are verification scripts run on demand against the emulator (`bun scripts/rules-test.ts` — run with bun, NOT tsx; tsx trips a rules-unit-testing type quirk).
- **Lint:** `bun run lint` CLEAN after every step through v22.
- **Type check:** `bunx tsc --noEmit` — no errors under `src/` (pre-existing noise only in `examples/`, `skills/`, `tool-results/`).
- **Browser verification (mandatory per step):** agent-browser @1280/390, fa+en. G1 evidence: `roadmaps/evidence/g1-demo-second-device-appears.png`, `g1-cloud-second-device-appears.png`, `g1-tab2-to-tab1-no-refresh.png`, `g1-sdk-offline-browse.png`, `g1-offline-queue-synced.png`. View-switch sweep clean, page errors none, `dev.log` clean.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must revoke old PAT and issue a fine-grained PAT (this repo, Contents: R/W). Re-tested 2026-11-05: `git push --dry-run origin main` → `could not read Username`. | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–3 so far) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed at least twice by platform rollbacks (latest: during step 23, before the S5 close-out push) and rebuilt each time** | Pushed every step; parity proven via `git ls-remote backup` (see §9). Rebuild after any wipe (1 command): `git init --bare /home/z/my-project-backup.git && git push backup main` |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; demo sample reseeded via `POST /api/seed`; not product data loss. |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders in `.env`; production cloud persistence NOT verified (honest). |
| Emulator data (probe user + G1 test docs) | ⚠️ Ephemeral emulator state (untracked) | Emulator suite is runtime-only | Recreate anytime: start emulators, sign up a fresh user via UI; G1 tests are re-runnable (worklog Step 22 documents the exact commands). |
| Dev server, emulator processes | ⚠️ Not persistent | Process state | `bun run dev`; `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after is recoverable only from this sandbox (local disk + `backup` mirror) until the owner supplies the push credential. Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v24 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | clean at last check (post-S2 commit — verify live) |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` 2026-11-05: `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`; **push blocked (no credential)** |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed + parity proven every step |
| Local HEAD at v24 | see `git rev-parse HEAD`; chain: …G1+S5-code `806d717` → S5 close-out `8c968b1` → **S2 commit (see live rev-parse)** — 25+ commits ahead of frozen origin |
| Phase status | **Phase 1 ✅ COMPLETE · Phase 2 ✅ COMPLETE · Phase 3 ✅ COMPLETE (G1 step 22, S5 step 23, S2 step 24) — Phases 4–5 await owner** |

Authoritative live check:

```bash
git rev-parse HEAD && git status --short \
 && git ls-remote backup refs/heads/main \
 && GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=true git -c credential.helper= ls-remote https://github.com/Sohrab1999/Savedmassagemanager1.git refs/heads/main
# backup/main must equal local HEAD; origin read anonymously shows its true (frozen) state.
```

## 10. Recovery Procedure (fresh environment, no chat history)

1. `git clone https://github.com/Sohrab1999/Savedmassagemanager1.git my-project` (public read; ⚠️ recovers only to `e5898b2` until owner pushes — then fully current). If a local `backup` mirror exists, prefer `git clone /home/z/my-project-backup.git` (fully current).
2. Read in this order: this file → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `worklog.md`.
3. `bun install` · `.env` (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + `NEXT_PUBLIC_FIREBASE_*` emulator placeholders or real values) · `bun run db:push`.
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately; cloud mode needs the emulator (`bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`) or real Firebase env.
5. Resume from §1 "Next allowed step" / roadmap checkboxes (Phases 1–3 complete; Phase 4 awaits the owner's order).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure (items 1–5 of v8, unchanged).
2. **Full application build** (`be5caad`) + **Firebase Auth/Firestore integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1 list-row dates · QE2 filter-toolbar reorganization · QE3 clickable category cards · QE4 card tag chips (+N) · QE5 active-filters bar · QE6 causal save hints · QE7 password-reset blocker registered + final regression. All committed, backup parity proven per step.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7 read consolidation (`6273298`) · S8 chunked writeBatch fan-outs (`4bf21a2`, emulator-verified) · S1 server-side pagination both modes, 500-cap deleted (`5f9d004`, demo@623 + cloud@601 verified) · S4 title/content editor (`6f392d2`) · S3 filters in URL hash (`49ccb44`) · close-out regression (`1dc294b`).
6. **Step 22 — G1 DONE (Phase 3 opens):** persistentLocalCache + multi-tab manager (`firebase.ts`); `realtimeStore` with 3 uncapped onSnapshot listeners (`realtime.ts` NEW); ALL repository one-shot reads → live-store reads (S7 TTL snapshot + S1 cloud structured path deleted; fan-outs now read-free AND uncapped); realtime bridge in app-shell (coalesced invalidations, full teardown); demo 2 s polling; `deletedAt` data plumbing (DTO/NoteDoc/Prisma + rules whitelist, 39/39); **DoD verified live on emulator: second-device push, tab2→tab1 without refresh, offline cache browsing, offline write queue + sync after reconnect** (`roadmaps/evidence/g1-*.png`); rules-test re-run 39/39; lint clean; tsc clean (src/); dev.log clean. SNAPSHOT v22; committed & backup parity proven.
7. **Step 23 — S5 DONE (undo delete):** soft-delete + restore + trash view + 7-day purge + undo-rate KPI (code shipped in `806d717` alongside G1 — see v23 provenance note); step-23 work = fresh demo-mode DoD verification (delete → toast+«بازگردانی» → trash view → «بازگردانی از سطل» → full restore 21→20→21; deep-link `trash=1`; KPI «۱ از ۱ (۱۰۰٪)»), evidence review (9 screenshots), docs. SNAPSHOT v23; committed & backup parity proven.
8. **Step 24 — S2 DONE (capture unification — Phase 3 closes):** shared `tag-chips-input.tsx` for quick-capture AND detail sheet (Enter/`,`/`،` commit, Backspace-remove, commit-on-blur, datalist suggestions); paste-a-URL-in-title → auto type=link + URL filled + hint (QE6 precedence kept); sheet tag mutation = one `{tagNames}` patch (stale-closure race removed); i18n fa+en (`tags.addPlaceholder`, `tags.remove`, `capture.linkDetected`). DoD verified live: paste-link fa+en, chips add/remove in both paths, persistence, comma semantics, @390 mobile, 4-view regression clean. SNAPSHOT v24; committed & backup parity proven.

## 12. Remaining Work

- **Phases 4–5 (await owner order):** S6 bulk ops (multi-select → category/archive/delete), QE-tagging typeahead (from existing tags — note: S2 already ships datalist suggestions), G2 AI assist (separate decision), P3 real file upload; P1 Telegram bridge FROZEN until explicit owner order.
- **Cloud-Go-Live backlog:** password-reset link (QE7, real Email provider); composite-index completion in production console (`firestore.indexes.json` has 11 declared; G1 made most read-time composites unnecessary — prune at go-live review); optional server-side trash purge (Cloud Scheduler) to complement the client-side 7-day sweep.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7).

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump + date).
2. [x] Affected reference docs updated: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/ENVIRONMENT.md`, roadmap file, `worklog.md`.
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA.
4. [x] `git status` reviewed before commit — no essential file left untracked/unstaged; nothing essential only in temp locations.
5. [x] Commit with a descriptive message.
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror) today; true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
