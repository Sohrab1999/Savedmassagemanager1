# SNAPSHOT — Savedbox (Personal Knowledge Manager / TeleVault)

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 25 · **Date:** 2026-11-07 · **Snapshot author:** Z.ai Code agent
> **v25 changelog:** ECC workflow layer installed (agent tooling, step 25) — 11 curated `skills/ecc-*` skills + `AGENTS.md` lifecycle + `docs/ECC-INSTALL.md` install record via the ECC Manual Adaptation path (security sweep PASS; provenance commit `d2ef268`). Product phases unchanged: Phases 4–5 still await the owner's order. Honest notes: `/skills/` is gitignored → ECC folders were force-added to git; lint re-verified CLEAN (the install brief's "4706 problems" was not reproducible — see §12).
> **Versioning note (honesty):** the step-25 task brief said "bump to v9", but the live file was already at **v24** (v9 was consumed by Phase 1 history long ago). The monotonic protocol bump lands at **v25**; no version numbers were regressed.
> **v24 status (historical, still true):** ROADMAP PHASE 3 COMPLETE — G1 ✅ + S5 ✅ + S2 ✅, all DoD-verified (demo + live Firebase Emulator, fa/en, 1280/390). Phases 4–5 await the owner's order.
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
| **Current gate** | **Roadmap Phase 3 — Experience Leap: COMPLETE (owner order).** G1 ✅ (step 22) · S5 ✅ (step 23) · S2 ✅ (step 24) — all DoD-verified. **Phases 4–5 (S6 bulk ops, tag typeahead, G2 AI assist, P3 real file upload) await the owner's order.** After each step: full SNAPSHOT update + reference-doc updates + commit + push + SHA-parity proof (standing owner mandate). |
| Agent tooling (new, step 25) | **ECC workflow layer installed** — 11 curated skills (`skills/ecc-*`), `AGENTS.md` lifecycle, `docs/ECC-INSTALL.md` install record. Manual Adaptation path (no native ECC target in this harness). See §2 "ECC workflow layer". |
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
- **Quick capture dialog** (`src/components/app/quick-capture.tsx`): 5 content types, title/content/url/mediaUrl, category, comma-separated tags; **QE6 (v14): error-prevention save flow** (causal disabled-state hint); **S2 (v24): paste-link detection + shared tag chips** (below).
- **Note detail sheet** (`src/components/app/note-detail-sheet.tsx`): metadata, description editing, **S4 (v19): title/content editing** (pencil → Input+Textarea, causal disabled save, persists in BOTH modes); tag add/remove via the shared S2 chips component; favorite/archive/delete (confirm), open original, copy content.
- **Note cards** (`src/components/app/note-card.tsx`): type-aware thumbnail, favorite toggle, category chip; QE1 list rows (snippet + relative date, `ms-auto`); QE4 shared `TagChips` (max 2 + Persian `+N`).
- **Dual-mode data source** (`src/services/data-source.ts`): authenticated → Firestore repository; else → demo API over Prisma/SQLite (sample data, honestly labeled).
- **G1 REALTIME + OFFLINE (v22, the phase-3 core, Cloud mode):**
  - **`src/services/firebase.ts`** initializes Firestore with `persistentLocalCache({ tabManager: persistentMultipleTabManager() })` — IndexedDB persistence (browse offline, queued writes reconcile on reconnect) + multi-tab coordination. Fallbacks: SSR → `getFirestore`; HMR re-init → existing instance; IndexedDB blocked → `memoryLocalCache`. DEV-ONLY debug hook `window.__savedboxFirestore.{goOffline,goOnline}` (emulator builds only).
  - **`src/services/realtime.ts`** — `realtimeStore`: THREE permanent uncapped `onSnapshot` listeners per UID (notes/categories/tags) replacing EVERY one-shot read; exposes live arrays + `ensureReady()` + `subscribe`/version + `getNoteById` + `mapNote`; includes the S5 7-day trash purge (batched, once per session).
  - **`src/services/repository.ts`** — reads derive from the live store (listNotes = 30-page presentation over the full local array; stats/categories/tags = joins; loadCategoryRef/resolveTagRefs live-first with getDoc fallbacks). The S1 structured-query path is DELETED (superseded — guarantees preserved: uncapped, exact totals, demo-parity sorts). Fan-outs target the live array → read-free and UNCAPPED (MAX_NOTES_FETCH=500 lookup cap gone).
  - **`src/components/app/app-shell.tsx`** — realtime bridge: start on sign-in, coalesced (50 ms) `queryClient.invalidateQueries()` on every snapshot, full teardown on unmount/UID change/sign-out. Single component-level listener → no unmount leak.
  - **`src/hooks/queries.ts`** — demo mode polls every 2 s (notes/stats/categories/tags, active tab only); cloud never polls.
  - **DoD verified live (2026-11-05):** second-device REST write appears without refresh; tab2-UI-write → tab1 without refresh; browser-offline write survives reload and syncs on reconnect; SDK-offline: cache browsing + local latency-compensation display + server stays stale until `goOnline()` then syncs. Evidence: `roadmaps/evidence/g1-*.png` (5 files). Rules 39/39 after `deletedAt` whitelist.
- **S2 CAPTURE UNIFICATION (v24, demo DoD verified live):**
  - **`src/components/app/tag-chips-input.tsx` (the shared component):** ONE tag-entry UX for quick capture AND the note detail sheet — chips (Badge + per-chip remove `aria-label`), inline field commits on Enter/`,`/`،` (immediate commit when a separator is typed; paste "a,b" → two chips), Backspace-on-empty removes the last chip, **commit-on-blur never loses a draft tag on Save**, exact-match dedup, existing tags as `datalist` suggestions; Input-look container (focus ring), RTL-safe.
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
- **ECC workflow layer (agent tooling — NEW, step 25, commit `9361459`):**
  - **What:** 11 curated skills from [ECC](https://github.com/affaan-m/ecc) ("the agent harness operating system", MIT, 71 agents/314 skills) installed under **`skills/ecc-*`**: `ecc-tdd-workflow`, `ecc-verification-loop`, `ecc-security-review` (+ reference `cloud-infrastructure-security.md`), `ecc-change-impact`, `ecc-typescript-patterns`, `ecc-react-patterns`, `ecc-react-performance`, `ecc-nextjs-turbopack`, `ecc-prisma-patterns`, `ecc-i18n-sync`, `ecc-frontend-a11y`.
  - **Provenance:** source commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b` (2026-11-06, merge PR #3650); install record with full provenance, security review and the 11 SKILL.md sha256 checksums = **`docs/ECC-INSTALL.md`**; only the frontmatter `name:` was adapted (folder name) — bodies byte-identical (verified `diff -r` at install).
  - **Workflow layer:** **`AGENTS.md`** (project root) = ECC core lifecycle `plan → test → implement → review → verify → remember → improve`, skill-activation table, command-intent registry (verbal intents, since no slash commands), upgrade procedure.
  - **Honest capability boundaries** (full table in `docs/ECC-INSTALL.md`): skills ✅ installed (11 of 314) · agents (71) ❌ not installed (harness has its own agent system) · commands (98) ❌ no slash-command system (intent registry in `AGENTS.md`) · hooks ❌ not installable (no hook runtime here) · rules packs ❌ not installed (`AGENTS.md` is the workflow layer) · memory/continuous-learning ❌ hook-coupled upstream; here = SNAPSHOT + worklog protocol · AgentShield ❌ not installed as tooling (manual security sweep performed at install, PASS).
  - **Activation:** skills activate through this harness's **Skill tool** (discovered from `skills/ecc-*/SKILL.md`); nothing pretends hooks or slash commands exist. There is **no runtime enforcement** — the lifecycle is advisory process, not code.
  - **Repo-persistence note:** the platform scaffold gitignores all of `/skills/` (`.gitignore` line 54). The 11 `skills/ecc-*` folders were therefore force-added (`git add -f`) and are committed — a fresh clone of `backup` (or of origin post-push) contains them. The other 19 harness-provided skills in `skills/` remain untracked by platform policy.
  - **Security:** pre-install sweep PASS (file inventory = SKILL.md only + 1 defensive reference md; no scripts/binaries/hooks/dotfiles; pattern sweep: 1 benign defensive hit — `tdd-workflow/SKILL.md` rejecting fetch-and-execute patterns). Temporary clone `.ecc-source/` deleted after checksums.

## 3. Architecture & Technical Contracts (binding)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route: `/`. API routes (`src/app/api/**`), not server actions.
- **Styling:** Tailwind CSS 4 + shadcn/ui; RTL-first; logical CSS properties mandatory; no indigo/blue unless owner asks; responsive mobile-first; sticky footer.
- **Data (dual-mode):** authenticated = Firestore per-UID (`users/{uid}/…`); unauthenticated = Prisma/SQLite demo (`db/custom.db`, untracked; `bun run db:push`). **G1 contract: cloud reads ALWAYS come from `realtimeStore` (repository starts it idempotently and awaits `ensureReady()`); UI pagination is presentation over the full local set; demo list remains server-paginated (30/page) with 2 s polling.**
- **Firebase Emulator Suite (running in-sandbox for cloud verification):** `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox` (Auth :9099, Firestore :8080, UI :4000). `.env` has emulator placeholders + `NEXT_PUBLIC_FIREBASE_EMULATOR=true`. Bulk data via Firestore REST `:commit` with `Authorization: Bearer owner`; REST field encoding gotcha: nullable strings MUST be `{"nullValue": null}` (not `{"stringValue": null}`). Probe UID (G1 session): `94ZKYTmgH7xJibbkfR0RUY7vPDDT` (`tool-results/g1-probe-uid.txt`, untracked).
- **State:** Zustand (view/detailNoteId/captureOpen/filters) + TanStack Query (UID-scoped keys; invalidations from mutations AND the realtime bridge).
- **Firebase:** env-driven; UID always derived from verified Auth state; **never store credentials in the repo.**
- **i18n:** every new UI string in BOTH `en` and `fa` (`src/lib/i18n/dictionaries.ts`); `t()`; Persian digits via `src/lib/format.ts`.
- **Dev/ops:** `bun run dev` (3000, logs → `dev.log`); never `bun run build`; never write test code (owner instruction); rules-test/e2e scripts are verification scripts run on demand.
- **Agent tooling contract (ECC, new):** ECC skills are markdown guidance activated via the harness **Skill tool** from `skills/ecc-*/SKILL.md`; `AGENTS.md` is the advisory workflow layer. This harness has **no hook runtime and no slash-command system** — ECC enforcement/slash capabilities are NOT present and must not be assumed. Upgrade procedure = fresh ECC clone at a recorded commit + re-run the documented security sweep + re-record checksums (see `AGENTS.md` → "Upgrade procedure" / `docs/ECC-INSTALL.md`).
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

`package.json` authoritative: next 16.1.1, react 19, prisma 6.19.2 (client), **firebase ^11 (auth + firestore; persistentLocalCache/persistentMultipleTabManager in use)**, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix set via shadcn/ui, sonner (toasts), lucide-react, z-ai-web-dev-sdk 0.0.18 (unused so far). Install with `bun install`. **Step 25 added ZERO runtime dependencies** (ECC shipped as markdown skills only).

## 7. Tests & Quality Status

- **Owner rule: no test code.** `scripts/rules-test.ts` (Firestore rules assertions — **39/39 PASS after the G1 rules change**) and `scripts/e2e-verify.sh` (15/15 at Firebase-phase time) are verification scripts run on demand against the emulator (`bun scripts/rules-test.ts` — run with bun, NOT tsx; tsx trips a rules-unit-testing type quirk).
- **Lint:** `bun run lint` (=`eslint .`) **re-verified CLEAN at step 25 (2026-11-07): exit 0, zero problems, ~7 s** — verified directly AFTER the ECC install (ECC added only `.md` files; no `.ts/.tsx` touched). (The step-25 install brief reported a 4706-problem lint failure — NOT reproducible after the temporary `.ecc-source/` clone was removed; see §12 honest note.)
- **Type check:** `bunx tsc --noEmit` — no errors under `src/`; pre-existing noise only in `examples/` (socket.io module stubs) and `skills/image-edit` (re-verified 2026-11-07: 3 error lines, none under `src/`).
- **Browser verification (mandatory per step):** agent-browser @1280/390, fa+en. G1 evidence: `roadmaps/evidence/g1-demo-second-device-appears.png`, `g1-cloud-second-device-appears.png`, `g1-tab2-to-tab1-no-refresh.png`, `g1-sdk-offline-browse.png`, `g1-offline-queue-synced.png`. View-switch sweep clean, page errors none. **Step 25 (docs/tooling only, no UI change): dev.log healthy re-check instead (API 200s, Prisma OK, compiled) — no browser run needed for zero-UI steps.**
- **Liveness checks (step 25, verified):** `ls skills | grep -c '^ecc-'` → **11** · `ls skills/*/SKILL.md | wc -l` → **30** · dev.log tail: API 200s + Prisma queries + `✓ Compiled`.

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| **Push credential for `origin` (GitHub)** | 🚫 **ABSENT — origin push BLOCKED** | Security closure 2026-11-04: chat-exposed PAT removed; owner must revoke old PAT and issue a fine-grained PAT (this repo, Contents: R/W). Re-tested 2026-11-05: `git push --dry-run origin main` → `could not read Username`. | Owner: `printf 'https://<user>:<PAT>@github.com\n' \| git credential approve` per `docs/ENVIRONMENT.md` §5, then `git push origin main` — ALL commits (entire app + Phases 1–3 + ECC layer) are queued on `main`; ONE push syncs everything. Until then GitHub holds state up to `e5898b2` only. |
| `origin` (GitHub) content currency | ⚠️ **Frozen at `e5898b2`** | No credential (row above) | Everything after `e5898b2` exists **only in this sandbox + the local `backup` mirror** until the owner pushes. Single biggest recovery gap; flagged per owner requirement #8. |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only (`/home/z/my-project-backup.git`) | Survives project-dir loss, NOT total sandbox destruction. **Destroyed at least THREE times by platform rollbacks (latest: found MISSING at the step-25 close-out push, 2026-11-07) and rebuilt each time** | Found missing at step-25 close-out → rebuilt per the 1-command procedure below → **pushed + parity proven EQUAL** (`git ls-remote backup refs/heads/main` == local `git rev-parse HEAD` at push time; actual SHAs in worklog Step 25; re-runnable via §9 live check). Rebuild after any wipe (1 command): `git init --bare /home/z/my-project-backup.git && git push backup main` |
| ECC upstream provenance | ✅ Recorded in-repo | ECC source lives upstream (github.com/affaan-m/ecc, MIT); installed copies are committed here (`skills/ecc-*`, force-added past the `/skills/` gitignore) | Current clones already contain the 11 ECC skills. If ever needed: re-clone ECC at the recorded commit `d2ef268…` (or any later recorded commit) and re-run the documented security sweep + checksums, per `docs/ECC-INSTALL.md` §Cleanup & upgrade and `AGENTS.md` → "Upgrade procedure". |
| Non-ECC harness skills (`skills/` minus `ecc-*`) | ⚠️ Outside the repo (gitignored by platform policy, line 54) | Platform scaffold ignores `/skills/`; only the 11 ECC folders were force-added | Re-provisioned by the platform harness / reinstall docs (`docs/ENVIRONMENT.md` §4); not project data. |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB | Recreated by `bun run db:push`; demo sample reseeded via `POST /api/seed`; not product data loss. |
| Real-Firebase env values | 🚫 Not present | Owner's console values never supplied | Emulator placeholders in `.env`; production cloud persistence NOT verified (honest). |
| Emulator data (probe user + G1 test docs) | ⚠️ Ephemeral emulator state (untracked) | Emulator suite is runtime-only | Recreate anytime: start emulators, sign up a fresh user via UI; G1 tests are re-runnable (worklog Step 22 documents the exact commands). |
| Dev server, emulator processes | ⚠️ Not persistent | Process state | `bun run dev`; `bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`. |
| `~/.agents/skills/*` | ⚠️ Outside repo | Install-to-home by design | Reinstall per `docs/ENVIRONMENT.md` §4. |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/docs persisted in `docs/` + `roadmaps/` + `worklog.md`. |

**Acceptance criterion status (owner 2026-11-05): PARTIALLY MET — honestly scoped.** A fresh clone of GitHub restores the project **up to `e5898b2`**; everything after (the whole app, Phases 1–3, and now the ECC layer) is recoverable **fully and immediately from the `backup` mirror** and only from this sandbox until the owner supplies the push credential. Every local commit is queued and push-ready. No false parity claims.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v25 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | 12 pre-existing files intentionally UNCOMMITTED (S2 close-out leftovers, listed in §12) + nothing else — verify live |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — anonymous `ls-remote` 2026-11-05: `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`; **push blocked (no credential)**; unchanged at v25 |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — pushed + parity proven every step; **this step: mirror found missing (platform rollback) → rebuilt per §8 → pushed → parity EQUAL at step-25 close-out (actual SHAs in worklog Step 25)** |
| Local HEAD at v25 | see `git rev-parse HEAD`. Chain: … G1+S5-code `806d717` → S5 close-out `8c968b1` → S2 `8d93733` → **`c0f31b6`** (platform auto-commit, UUID-titled message `c72c28a9-33fe-4b58-9d1e-8218ce345835`, touched only `.zscripts/dev.pid` — pre-existing, sits at HEAD^ of the ECC commit) → **ECC install `9361459`** → **v25 snapshot/docs commit (docs-only: SNAPSHOT + worklog — the live HEAD)** — 27+ commits ahead of frozen origin |
| Phase status | **Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ COMPLETE (G1 step 22, S5 step 23, S2 step 24) — Phases 4–5 await owner. Step 25 = agent tooling (ECC), no product phase change.** |

**Liveness checks (add step 25; expected values verified 2026-11-07):**

```bash
ls skills | grep -c '^ecc-'      # → 11
ls skills/*/SKILL.md | wc -l     # → 30
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
3. `bun install` · `.env` (`DATABASE_URL=file:/home/z/my-project/db/custom.db` + `NEXT_PUBLIC_FIREBASE_*` emulator placeholders or real values) · `bun run db:push`.
4. `bun run dev` → port 3000 (check `dev.log`). Demo mode works immediately; cloud mode needs the emulator (`bunx firebase-tools emulators:start --only auth,firestore --project demo-savedbox`) or real Firebase env.
5. **ECC skills (new, step 25):** a current `backup` clone already contains `skills/ecc-*` (committed force-added). If recovering from the FROZEN origin clone (≤ `e5898b2`) or the folders are ever missing: re-clone ECC at the recorded commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b` (or any later recorded commit), re-run the security sweep + checksums per `docs/ECC-INSTALL.md` §Cleanup & upgrade.
6. Resume from §1 "Next allowed step" / roadmap checkboxes (Phases 1–3 complete; Phase 4 awaits the owner's order).

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep (E1/E2) → product docs → persistence protocol → D1–D16 → GitHub origin + security closure (items 1–5 of v8, unchanged).
2. **Full application build** (`be5caad`) + **Firebase Auth/Firestore integration** (`e214a98`, rules 39/39, E2E 15/15).
3. **Feature X deep analysis** → `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` (phases 1–5, DoD, scoring).
4. **Phase 1 Quick Wins COMPLETE (v9–v15):** QE1 list-row dates · QE2 filter-toolbar reorganization · QE3 clickable category cards · QE4 card tag chips (+N) · QE5 active-filters bar · QE6 causal save hints · QE7 password-reset blocker registered + final regression. All committed, backup parity proven per step.
5. **Phase 2 Data Foundation COMPLETE (v16–v21):** S7 read consolidation (`6273298`) · S8 chunked writeBatch fan-outs (`4bf21a2`, emulator-verified) · S1 server-side pagination both modes, 500-cap deleted (`5f9d004`, demo@623 + cloud@601 verified) · S4 title/content editor (`6f392d2`) · S3 filters in URL hash (`49ccb44`) · close-out regression (`1dc294b`).
6. **Step 22 — G1 DONE (Phase 3 opens):** persistentLocalCache + multi-tab manager (`firebase.ts`); `realtimeStore` with 3 uncapped onSnapshot listeners (`realtime.ts` NEW); ALL repository one-shot reads → live-store reads (S7 TTL snapshot + S1 cloud structured path deleted; fan-outs now read-free AND uncapped); realtime bridge in app-shell (coalesced invalidations, full teardown); demo 2 s polling; `deletedAt` data plumbing (DTO/NoteDoc/Prisma + rules whitelist, 39/39); **DoD verified live on emulator: second-device push, tab2→tab1 without refresh, offline cache browsing, offline write queue + sync after reconnect** (`roadmaps/evidence/g1-*.png`); rules-test re-run 39/39; lint clean; tsc clean (src/); dev.log clean. SNAPSHOT v22; committed & backup parity proven.
7. **Step 23 — S5 DONE (undo delete):** soft-delete + restore + trash view + 7-day purge + undo-rate KPI (code shipped in `806d717` alongside G1 — see v23 provenance note); step-23 work = fresh demo-mode DoD verification (delete → toast+«بازگردانی» → trash view → «بازگردانی از سطل» → full restore 21→20→21; deep-link `trash=1`; KPI «۱ از ۱ (۱۰۰٪)»), evidence review (9 screenshots), docs. SNAPSHOT v23; committed & backup parity proven.
8. **Step 24 — S2 DONE (capture unification — Phase 3 closes):** shared `tag-chips-input.tsx` for quick-capture AND detail sheet (Enter/`,`/`،` commit, Backspace-remove, commit-on-blur, datalist suggestions); paste-a-URL-in-title → auto type=link + URL filled + hint (QE6 precedence kept); sheet tag mutation = one `{tagNames}` patch (stale-closure race removed); i18n fa+en (`tags.addPlaceholder`, `tags.remove`, `capture.linkDetected`). DoD verified live: paste-link fa+en, chips add/remove in both paths, persistence, comma semantics, @390 mobile, 4-view regression clean. SNAPSHOT v24; committed & backup parity proven.
9. **Step 25 — ECC workflow layer installed (agent tooling, no product-code change):** ECC (github.com/affaan-m/ecc, MIT) had no native target in this harness → documented **Manual Adaptation path** used. Security sweep PASS (pre-install; 1 benign defensive hit; no scripts/binaries/hooks). Installed **11 curated skills** (`skills/ecc-*`, bodies byte-identical, frontmatter name adapted; project total now 30 SKILL.md) + **`AGENTS.md`** workflow layer (lifecycle, skill table, intent registry, upgrade procedure) + **`docs/ECC-INSTALL.md`** (provenance, security review, boundary table, 11 sha256 checksums). `/skills/` gitignored by platform → ECC folders force-added so a clone carries them. **Commit `9361459f719cefc987e199fa1308abcba143e982`** (feat(ecc)…) + this docs commit; backup parity proven at close-out. Lint re-verified CLEAN; tsc noise unchanged (no `src/` errors); dev.log healthy. SNAPSHOT v25.

## 12. Remaining Work & Known State

- **Phases 4–5 (await owner order):** S6 bulk ops (multi-select → category/archive/delete), QE-tagging typeahead (from existing tags — note: S2 already ships datalist suggestions), G2 AI assist (separate decision), P3 real file upload; P1 Telegram bridge FROZEN until explicit owner order.
- **Cloud-Go-Live backlog:** password-reset link (QE7, real Email provider); composite-index completion in production console (`firestore.indexes.json` has 11 declared; G1 made most read-time composites unnecessary — prune at go-live review); optional server-side trash purge (Cloud Scheduler) to complement the client-side 7-day sweep.
- Pending owner items: **new PAT for `origin` push (single biggest durability gap — ALL work queued on `main`)**; D17 ruling; A1–A8 review (Phase 0 W7).
- **Honest note (a) — lint discrepancy:** the step-25 install brief reported `bun run lint` failing with 4706 problems (4570 errors / 136 warnings). **Direct re-verification at close-out (2026-11-07, with `skills/ecc-*` present and `.ecc-source/` deleted): lint PASSES — exit 0, zero problems, ~7 s.** The 4706 figure is not reproducible in the current workspace; it is recorded here as an unreproducible/transient install-time observation, NOT as current state. ECC added only `.md` files, so no lint impact from this step is plausible either way.
- **Honest note (b) — pre-existing uncommitted working-tree modifications (from earlier S2 close-out work; NOT part of step 25, deliberately left unstaged):** modified `roadmaps/evidence/s2-capture-paste-link.png`, `s2-capture-paste-link-en.png`, `s2-capture-tag-chips.png`, `s2-capture-en-390.png`, `s2-detail-shared-chips.png`, `s5-demo-restored-back-to-21.png`, `s5-demo-trash-detail.png`, `s5-demo-trash-view.png`, `s5-demo-undo-rate.png`, `s5-demo-undo-toast-fresh.png`, modified `src/components/app/tag-chips-input.tsx`, modified `.zscripts/dev.pid`. Owner/next-session decision required: commit, restore, or discard.
- ECC maintenance: skill upgrades follow `AGENTS.md` → "Upgrade procedure" (fresh clone at a recorded commit → security sweep → re-copy 11 folders → re-record checksums → commit).

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04, re-issued with acceptance criterion 2026-11-05: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [x] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump + date).
2. [x] Affected reference docs updated: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/ENVIRONMENT.md`, roadmap file, `worklog.md`. (Step 25 scope: SNAPSHOT + worklog + ECC docs; the other reference docs describe product decisions/phases, which did not change.)
3. [x] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA.
4. [x] `git status` reviewed before commit — no essential file left untracked/unstaged; nothing essential only in temp locations. (Step 25: the 11 `skills/ecc-*` folders force-added past the platform `/skills/` gitignore; pre-existing S2 close-out modifications deliberately left unstaged and listed in §12.)
5. [x] Commit with a descriptive message.
6. [x] Push to every configured remote and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`. **Current reality: `backup` always provable; `origin` push blocked — credential absent (owner action). Every commit queued for the single owner push.** Never claim origin parity falsely.
7. [x] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [x] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress. **Honest status: true for `backup` (same-fs mirror, incl. the ECC layer) today; true for `origin`/GitHub the moment the owner supplies the push credential — all commits are queued on `main`.**
