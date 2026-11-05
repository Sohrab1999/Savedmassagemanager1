# Worklog — Personal Knowledge Manager

Chronological record of every work step. Newest first. Each entry links to evidence (commits, verification commands, outputs). The Persistence Protocol (`docs/SNAPSHOT.md` §Protocol) requires an entry here for every step.

---

## 2026-11-05

### Step 12 — QE4 DONE: tags visible on cards (grid + list, +N overflow, zero shift)
- **Trigger:** Roadmap Phase 1 item QE4: "نمایش حداکثر ۲ تگ (+N) در پایین کارت گرید و انتهای ردیف لیست. DoD: کارت بدون تگ، سطر اضافه نمی‌گیرد (no layout shift)."
- **Change (1 file):** `src/components/app/note-card.tsx` — new shared `TagChips` component (max 2 chips + `+N` with Persian digits via `formatNumber`); rendered on grid cards between snippet and meta row, and on list rows below the snippet line (`compact` variant); returns `null` for untagged notes → zero layout shift.
- **DoD verification (agent-browser, fa):**
  - Grid: chips render on tagged cards (e.g. "دستور پخت", "nextjs"+"بهینه‌سازی", "سلامت"+"موسیقی") — `roadmaps/evidence/qe4-after-grid-1280.png`.
  - List: chips on 6/21 rows; geometry check — chips anchored at inline-start, date (QE1) at inline-end, no collision — `qe4-after-list-1280.png`.
  - No-layout-shift: 15 untagged rows render at the same height as the pre-QE4 baseline (conditional render).
  - `+N` overflow path: temporarily added a 3rd tag to "پلی‌لیست تمرین صبحگاهی" via API → chip "+۱" rendered (Persian digits) — `qe4-plusn-1280.png`; then `POST /api/seed` reseeded demo data (tags verified restored to 2). No product data touched (demo DB only).
- **Lint:** clean. **SNAPSHOT:** v12. **State after step:** QE1–QE4 ✅; next QE5.
- **Commit:** `feat(qe4): show up to 2 tag chips with +N overflow on note cards` (live `git rev-parse HEAD`; backup parity proven at commit time).

### Step 11 — QE3 DONE: category cards clickable (dashboard-parity affordance)
- **Trigger:** Roadmap Phase 1 item QE3: "کلیک روی کارت دسته = `setFilters({categoryId}) + setView('library')` (هم‌سو با داشبورد). DoD: رفتار سه نما (داشبورد/دسته‌ها/تگ‌ها) یکسان؛ منوی ⋯ دست‌نخورده."
- **Changes:** `src/components/app/views/categories-view.tsx` CategoriesTab — Card upgraded to `role="button"` + `tabIndex={0}` + aria-label `a11y.openCategory` + onClick/onKeyDown (Enter/Space) → `setFilters({ categoryId })` + `setView("library")`; hover/focus styles matching note cards; `stopPropagation` on the ⋯ DropdownMenuTrigger so menu clicks never navigate. `src/lib/i18n/dictionaries.ts` — new key `a11y.openCategory` (en: "Show items in this category", fa: "نمایش موارد این دسته"), both dictionaries type-checked.
- **DoD verification (agent-browser, fa):**
  - Click card "آموزش" → URL `#/library`, filter applied, results count "۳ مورد", category select shows آموزش. ✓
  - ⋯ menu: real click opens menu (menuitems ویرایش/حذف visible), URL stays `#/categories` — no accidental navigation. ✓
  - Keyboard: focus card → Enter → navigates to library. ✓
  - A11y: cards now exposed as named buttons in the accessibility tree. ✓
- **Lint:** clean. **SNAPSHOT:** v11. **State after step:** QE1 ✅ QE2 ✅ QE3 ✅; next QE4.
- **Commit:** `feat(qe3): make category cards clickable to filter the library` (live `git rev-parse HEAD`; backup parity proven at commit time).

### Step 10 — QE2 DONE: filter toolbar reorganized; sort & layout always in view
- **Trigger:** Roadmap Phase 1 item QE2: "Layout/Sort به انتهای «پایدار» نوار منتقل یا در دسکتاپ همیشه در دید … DoD: در ۱۲۸۰px و ۳۹۰px، تغییر چیدمان و مرتب‌سازی بدون اسکرول افقی در دسترس است؛ اسکرین‌شات قبل/بعد ثبت شود." (Option A chosen: stable always-visible segment — simplest, zero new strings, no architecture change.)
- **Change (1 file):** `src/components/app/views/library-view.tsx` — toolbar restructured into `<div flex items-center gap-1.5>`: (a) scrollable chip zone (`min-w-0 flex-1 overflow-x-auto`) = type/favorite/archived/category/tags; (b) **stable segment (`shrink-0`, outside the scroll area)** = separator + sort select + grid/list layout toggle. Removed the now-redundant third in-scroll separator.
- **DoD verification (agent-browser):**
  - Programmatic: layout-toggle `getBoundingClientRect()` fully inside viewport @1280 AND @390; `pageOverflowX=false`; fa (dir=rtl, lang=fa) + en both.
  - Evidence: `roadmaps/evidence/qe2-before-1280.png` + `qe2-before-390.png` (captured at step 8 — sort clipped/hidden) vs `qe2-after-fa-1280.png`, `qe2-after-fa-390.png` (sort "جدیدترین" + toggle fully visible at row end), `qe2-after-en-1280.png`, `qe2-after-en-390.png`.
  - Interaction regression: list-toggle click works (list rows render); QE1 dates still present in list rows; no horizontal page overflow at any tested width.
- **Lint:** clean. **SNAPSHOT:** v10. **State after step:** QE1 ✅ QE2 ✅; next QE3.
- **Commit:** `feat(qe2): keep sort & layout controls always visible in library toolbar` (live `git rev-parse HEAD`; backup parity proven at commit time).

### Step 9 — QE1 DONE: date restored to list rows (verified RTL/LTR/320px)
- **Trigger:** Roadmap Phase 1 item QE1 (`roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` §5): "در `NoteCard` لی‌اوت list، کنار snippet تاریخ نسبی نمایش داده شود. DoD: در نمای فهرست هر ردیف تاریخ دارد؛ تست دستی RTL/LTR هر دو؛ no-overflow در ۳۲۰px."
- **Change (1 file, ~5 lines):** `src/components/app/note-card.tsx` list layout — snippet line replaced by a flex row: snippet (`min-w-0 truncate`) + relative date (`ms-auto shrink-0 text-[10px]`), so both are always visible; logical property keeps RTL/LTR correct; no snippet → date-only row preserved.
- **DoD verification (agent-browser, demo mode):**
  - fa-RTL @1280px: every row shows snippet + Persian relative date at row end — `roadmaps/evidence/qe1-after-fa-1280.png`.
  - en-LTR @1280px: rows show snippet + "2 h ago" style dates — `roadmaps/evidence/qe1-after-en-1280.png`.
  - @320px (en): programmatic overflow check `scrollWidth>clientWidth` → page `false`, row `false`; visual — `roadmaps/evidence/qe1-after-en-320.png`.
  - Layout regression: none (title/snippet truncation intact; favorite toggle untouched).
- **Lint:** clean. **SNAPSHOT:** v9 (sections 2/7/9/11/12 updated). **Roadmap checkbox:** QE1 ticked in the same commit as the final Phase-1 docs pass (kept until then so the file documents live status at completion; status mirrored here + SNAPSHOT §12 now).
- **State after step:** QE1 ✅; next QE2 (filter-bar reorg; before-evidence already captured at step 8).
- **Commit:** `feat(qe1): show relative saved date in library list rows` (final HEAD — live `git rev-parse HEAD`).
- **Verification evidence:** local HEAD == `git ls-remote backup refs/heads/main` (recorded below at commit time; re-runnable via SNAPSHOT §9).

### Step 8 — Phase 1 Quick Wins launched: persistence baseline restored, SNAPSHOT v8 full rewrite, evidence captured
- **Trigger:** Owner mandate (Persian, 2026-11-05): execute `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` **Phase 1 — Quick Wins (QE1–QE7, no architecture changes)**; after every step fully refresh `docs/SNAPSHOT.md` (not summary-append), update all reference docs, commit, push to remote, prove SHA parity via `git ls-remote`; acceptance criterion = a destroyed sandbox must be recoverable via fresh clone + repository docs alone.
- **Protocol pre-check (live verification, before any change):**
  - Git: branch `main`, HEAD `8f3b15f`, working tree **clean**; roadmap §9 precondition satisfied (pending Firebase-phase changes were already committed as `e214a98`).
  - **Persistence debt found: `main` ahead of `origin/main` by 7 commits** (`9e623df` docs-reverify, `375b889` checkpoint, `be5caad` full Savedbox app, `90c6295` checkpoint, `e214a98` Firebase integration, `776923b` checkpoint, `8f3b15f` checkpoint). **`backup` remote DESTROYED** (`/home/z/my-project-backup.git` missing — aftermath of the earlier platform rollback): `git ls-remote backup` → `fatal: does not appear to be a git repository`.
  - **`origin` push capability test:** anonymous `ls-remote origin` exit 0 (`main = e5898b2…`), but authenticated push dry-run → `fatal: could not read Username for 'https://github.com'` (exit 128). Credential audit: no `~/.git-credentials`, no credential helper store entry, no env tokens, no netrc, `upload/` empty → **origin push remains BLOCKED by the standing security closure; only the owner can restore it (new fine-grained PAT)**. Recorded honestly in SNAPSHOT §8 (requirement #8).
- **Actions:**
  1. **`backup` mirror recreated**: `git init --bare /home/z/my-project-backup.git` → `git push backup main` → **parity proven: `git ls-remote backup refs/heads/main` = `8f3b15f0eb26cd8f9f74d76605462f4569bb9a2f` = local HEAD**. The entire 7-commit debt is now mirrored.
  2. **QE2 baseline evidence (DoD requirement)**: live screenshots captured via agent-browser on the running app (demo mode) — `roadmaps/evidence/qe2-before-1280.png` (filter bar: sort select clipped at edge, layout toggle off-frame) and `roadmaps/evidence/qe2-before-390.png` (sort + layout entirely out of view) — **re-confirming roadmap findings #1 against the live build**.
  3. **Lint baseline:** `bun run lint` → clean.
  4. **`docs/SNAPSHOT.md` FULLY REWRITTEN to v8** (previous v7 predated the whole application build and was outdated): real product identity (Savedbox full app), implemented capabilities (auth gate, 4-view IA, capture/library/detail, dual-mode data source, Firebase emulator-verified), binding contracts (incl. Phase-1 no-architecture-change constraint, i18n dual-dictionary rule), data structures, dependencies, quality status, **honest §8 ledger** (origin frozen at `e5898b2`; gap = absent credential, owner action; backup mirror recreated), live-check §9, recovery §10, completed-work §11, remaining work §12, updated §Protocol.
- **Honest deltas:** origin (GitHub) still frozen at `e5898b2` — every local commit (all app work + all Phase-1 steps) is queued on `main` and will be pushed by ONE `git push origin main` the moment the owner supplies a credential; until then off-sandbox durability = GitHub up to `e5898b2` + same-fs `backup` mirror for everything newer. This is the maximum technically possible compliance; no false parity claimed.
- **State after step:** Phase 1 not yet code-touched; baseline evidence + docs persisted. Next: QE1.
- **Commit:** this docs commit (final HEAD — see live `git rev-parse HEAD`; parity evidence below in this entry's verification line and SNAPSHOT §9).

---

## 2026-11-04

### Step 7 — GitHub backup independently re-verified (parity claim CONFIRMED); "empty" display diagnosed as checker artifact; security closure applied
- **Trigger:** Owner instruction: an independent public check displayed "This repository is empty," contradicting the Step 6 parity claim at `e5898b2`; resolve the discrepancy before declaring D13 fully verified; test recovery independently (fresh clone in a separate directory); apply security closure on the chat-exposed PAT; exact-evidence report. Constraints honored: never reuse/display/request/transmit the exposed token; no force-push or history rewrite; no product/roadmap/decision changes; no Phase 0 work; no visibility change.
- **Actions & evidence (2026-11-04):**
  1. **Local state:** branch `main`, HEAD `e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`, clean tree; `origin` = clean HTTPS URL (no embedded credential); `backup` = same-fs mirror; remote-tracking `origin/main` = `e5898b2` — treated as an unproven claim, not evidence.
  2. **Credential audit:** `gh` CLI absent; `credential.helper=store` → `~/.git-credentials` held exactly **one plaintext entry** (`https://x-access-token:<REDACTED>@github.com`, file mode 0600). **Credential REMOVED (security closure): file now empty, 0600 retained** — no GitHub credential remains anywhere in the sandbox; helper config left in place with an empty store. No `gh` hosts file; no shell-history file exists on this sandbox.
  3. **Repo secret-leak audit:** `rg --hidden --no-ignore` across the entire project (excl. `node_modules`/`.git`) for `github_pat_` → **only `worklog.md` line 16**, which is the Step 6 audit *description listing the scanned pattern names*; a token-length probe found **no actual token string**; pickaxe `-S'github_pat_'` over ALL local refs AND the backup mirror → **only `32c874b`**, which *added* that doc-text line; remote URL verified token-free; `dev.log` clean. **The PAT is not in the repository, its history, or the backup mirror.**
  4. **Anonymous remote verification (zero credential supply: `git -c credential.helper=` + `GIT_TERMINAL_PROMPT=0` + `GIT_ASKPASS=true`):** `git ls-remote https://github.com/Sohrab1999/Savedmassagemanager1.git` → **`e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea` for `HEAD` and `refs/heads/main`, exit 0**; `git ls-remote origin refs/heads/main` → same SHA; `git fetch origin --prune` → exit 0, tracking ref `e5898b2` confirmed. GitHub's **git tier serves the full repo to anonymous readers**.
  5. **"Empty"-display diagnosis:** anonymous `api.github.com` from this egress returns **HTTP 403 "API rate limit exceeded"** (verified against `octocat/Hello-World` and the target repo); the REST API additionally answers `{"message":"Git Repository is empty."}` (HTTP 409) for repos without commits — so an **API-based checker on a rate-limited/regionalized IP, or a cached pre-push snapshot, displays "This repository is empty." for a repo that is not empty**. Web-tier proof (no REST API involved): repo page HTTP 200; commit page `…/commit/e5898b2…` HTTP 200; `raw.githubusercontent.com/…/main/docs/PRODUCT_BRIEF.md` HTTP 200 with SNAPSHOT.md content served.
  6. **Independent recovery test (owner requirement §2):** fresh anonymous `git clone` into `/tmp/pkm-clone-test` — **performed with no credential existing in the sandbox at that moment** — exit 0; clone HEAD `e5898b2`; **11 commits, history identical to local**; `docs/PRODUCT_BRIEF.md`, `docs/PHASE0_CHECKLIST.md`, `docs/ROADMAP.md`, `docs/SNAPSHOT.md` (v6), `worklog.md` all present; clone `status` clean; `fsck --full` clean; usable fully standalone; temp clone removed after evidence capture.
  7. **Security closure records:** plaintext credential removed (above); **PAT revocation cannot be performed or confirmed by the agent — owner must revoke it** (GitHub → Settings → Personal access tokens → fine-grained tokens) and treat it as compromised until then; `git credential store` documented as **plaintext storage** (0600 shields against other local users only, not disk/backup access) — **Git Credential Manager recommended on Windows** (OS keychain; Linux equivalent: `libsecret`); **no replacement token created**; nothing embedded in remote URLs, repo files, history, shell history, or logs (verified this step).
- **Verdict:** Step 6 parity claim **CONFIRMED by independent credential-free channels**; D13 external backup **ACTIVE** at `e5898b2` (public). Owner-side re-check options: open `https://github.com/Sohrab1999/Savedmassagemanager1` in a browser, or run `git ls-remote https://github.com/Sohrab1999/Savedmassagemanager1.git` from any network.
- **Honest deltas this step:** (a) this step's commit **cannot be pushed to `origin`** — no credential exists by deliberate security closure; `origin/main` remains `e5898b2` until the owner supplies a new credential (restore one-liner: `docs/ENVIRONMENT.md` §5); `backup` parity for this commit proven in §9. (b) **PAT revocation status: NOT confirmed** (owner action pending). Product Brief, UX requirements, ROADMAP, product rulings untouched; Phase 0 gate unchanged. No code written.
- **Commit:** this docs commit (final HEAD — see live `git rev-parse HEAD`; parity evidence in SNAPSHOT §9).

### Step 6 — D13 resolved: GitHub origin configured as permanent external backup; full history pushed; parity verified
- **Trigger:** Owner instruction (this task only — "strictly about establishing and verifying external Git backup"): configure `https://github.com/Sohrab1999/Savedmassagemanager1` as the permanent external backup remote, preserving complete history, verifying parity, auditing secret exposure, documenting recovery without credentials. Explicit constraints: inspect auth state first; never overwrite remote history without inspecting; do not modify Product Brief / UX requirements / roadmap / product decisions; do not begin Phase 0 or design work.
- **Actions & evidence:**
  1. **Local inspection:** branch `main` (only branch), clean tree, remotes = `backup` (same-fs mirror) only; history = 9 commits (scaffold + docs).
  2. **Auth state:** `gh` CLI **not installed**; no git credentials, no env tokens → git's built-in **credential store** used as the secure credential manager: `credential.helper=store` → `~/.git-credentials` (**outside repo, mode 0600**). Token loaded into commands only via `git credential fill` (never echoed, never written into the repo). No `gh auth status` possible (CLI absent) — equivalent credential-manager inspection performed.
  3. **Repo verification (before any push):** authenticated API `GET /repos/Sohrab1999/Savedmassagemanager1` → HTTP 200: **public**, default branch `main`, **size 0 (empty — no existing commits, nothing overwritten)**, `permissions.push=True`. Note: anonymous `api.github.com` calls are 403 in this sandbox; authenticated calls work (ENVIRONMENT §2 updated).
  4. **`origin` configured** with CLEAN URL (no token embedded): `git remote -v` confirms `origin https://github.com/Sohrab1999/Savedmassagemanager1.git`. `backup` retained.
  5. **Secret-exposure audit (all 4 checks passed):** (a) full-history scan of every commit for `github_pat_`, `ghp_*`, AWS `AKIA*`, private-key blocks, `sk-*` API keys → **zero matches**; (b) literal PAT searched across HEAD tree and every historical blob → **absent**; (c) `.env` content verified benign: `DATABASE_URL=file:/home/z/my-project/db/custom.db` (local path, no secret); (d) tracked sensitive candidates found: `.env`, `db/custom.db` → **untracked** (`git rm --cached`), `.gitignore` extended with `/db/` + `*.db` (`.env*` already covered) — **hygiene commit `55c04e34de5eefd8dc49c8983bbe956146558426`** made BEFORE the first external push. Residual-history fact documented honestly (ENVIRONMENT §6): pre-hygiene commits retain the benign `.env` and scaffold db binary; no history rewrite (owner constraint: preserve complete history).
  6. **Pushes:** `main` pushed to `origin` and `backup`; upstream set. **Incident (transient, resolved):** first origin push reported `remote: fatal error in commit_refs` / `[remote rejected]` (known transient GitHub server error); retry said "Everything up-to-date". Verification proved the refs were actually written: `git ls-remote origin` = local HEAD; `git fetch origin` → commit counts identical (local 10 = origin 10). `backup` pushed cleanly (`bb45130..32c874b`).
  7. **Parity verification (final):** local HEAD `32c874b8f7980ae51d43eb4da65d8a2005834e65` == `git ls-remote origin refs/heads/main` == `git ls-remote backup refs/heads/main` — **EQUAL on both remotes; complete history identical (SHA equality proves full tree+history match)**. Re-runnable via SNAPSHOT §9.
  8. **Docs (no credentials anywhere):** `docs/ENVIRONMENT.md` §2/§5/§6/§7 (origin + push policy + recovery + rotation guidance + hygiene record); `docs/DECISIONS.md` D13 row only (environment decision, APPROVED & DONE — no product decision touched); `docs/SNAPSHOT.md` → **v6**; this worklog entry.
- **Security recommendation delivered to owner:** token was shared via chat → rotate/revoke after confirmation; issue a fine-grained PAT (this repo, Contents R/W) and overwrite the stored credential via the documented one-liner (ENVIRONMENT §5).
- **Product-scope guard honored:** Product Brief, UX requirements, ROADMAP, product rulings untouched; Phase 0 checklist remains DRAFT awaiting owner review; no design work started.
- **State after step:** external backup ACTIVE and verified; Phase 0 gate unchanged (awaiting checklist approval + optional D17 one-liner). **No code written. No stack chosen.**

### Step 5 — Final rulings D14–D16 applied; Brief v1.2; Phase 0 authorized (scoped) — entry checklist presented
- **Trigger:** Owner accepted v1.1 deliverables with final rulings — **D14** soft email verification (verified email required for sensitive ops such as export; account deletion requires identity re-authentication), **D15** controlled URL normalization (known tracking params only: `utm_*`, `fbclid`, `gclid`; meaningful params preserved; no aggressive rewriting), **D16** quota blocks file uploads only (notes/links stay savable) — plus **five binding instructions**: (1) silence ≠ approval for A1–A8, keep each explicitly unresolved until reviewed; (2) HTML bookmark export conditional on validated cost/scope, not a mandatory MVP acceptance criterion; (3) dark mode outside mandatory MVP scope unless explicitly required in the approved brief; (4) preserve all approved boundaries, no new features; (5) update DECISIONS.md + Brief only with these rulings, record remaining unresolved items transparently. Owner authorized Phase 0 ONLY within: UX requirements & journeys · IA validation · personas & use-cases · design principles & design-system foundations · wireframe planning for the four approved core screens — and required the Phase 0 checklist to be shown for review before any design work.
- **Actions:**
  - `docs/PRODUCT_BRIEF.md` → **v1.2** (targeted deltas only): §7-A (D14), §7-H (verified email + HTML conditional), §7-I (D17 marker), §7 File & Quota (D16), §8-J6, §9 duplicate detection (D15), DoD #11 (D17 marker) / #13 / #14, Appendix A (preamble "explicitly UNRESOLVED; silence ≠ approval", A1 revised, A6 marked SUPERSEDED), Appendix B rewritten (resolved vs. still-unresolved incl. D17 + D13), header/status, section version labels aligned. No other content touched.
  - `docs/CHANGELOG.md`: added v1.1 → v1.2 section (7 delta groups).
  - `docs/DECISIONS.md`: added §A2 (D14–D16 APPROVED with owner verbatim intent + the five binding instructions + scoped Phase 0 authorization recorded as instruction 6); §B rebuilt — D17 (dark-mode scope confirmation) registered PENDING with factual check, A1–A8 explicitly UNRESOLVED (silence ≠ approval), D13 unchanged.
  - **`docs/PHASE0_CHECKLIST.md` created (v1.0 DRAFT — presented for owner review):** entry gate status; the five authorized workstreams (verbatim) + identification of the four approved core screens (Quick Capture, Library, Item Detail, Search — per audit/roadmap); hard constraints; deliverables D0-1…D0-6 with acceptance criteria; dependency-aware execution order W1–W7 (W7 = owner's individual A1–A8 review + D17 + exit package); explicit out-of-scope list; Phase 0 exit gate.
  - `docs/ROADMAP.md`: baseline → Brief v1.2; Phase 0 rebuilt around the authorized scope (checklist gate + W1–W7); competitive-notes item marked not-in-scope; Phase 2 auth/storage lines updated (D14/D16); Phase 3 export line updated (HTML conditional).
  - `docs/SNAPSHOT.md` → **v5** (complete rewrite per protocol).
- **Deliberately NOT done (owner gate):** no design work, no code, no stack selection, no wireframes — checklist approval required first.
- **Commits:** (1) `c97b3fa4d1a140d55b6c55dcb52b0eac4741d778` — `docs: apply final rulings D14-D16 (brief v1.2) + phase 0 entry checklist draft` (7 files, 238 insertions, 74 deletions; `docs/PHASE0_CHECKLIST.md` created); (2) this state-recording commit (final HEAD — see live `git rev-parse HEAD`).
- **Verification evidence (commit 1):** `git ls-remote backup refs/heads/main` = `c97b3fa4d1a140d55b6c55dcb52b0eac4741d778` = local HEAD — **EQUAL, parity proven**. Final parity re-checkable via SNAPSHOT §9 commands.
- **State after step:** Phase 0 authorized but gated on owner approval of `docs/PHASE0_CHECKLIST.md`. Open items: checklist review + D17 one-liner + A1–A8 individual review (W7, at Phase 0 exit) + D13 external remote. **No code written. No stack chosen.**

### Step 4 — Owner approved D1–D12; Product Brief v1.1 produced
- **Trigger:** Owner reviewed the audit, approved its direction, and issued explicit rulings D1–D12 plus six mandatory clarifications (canonical Item entity; async non-blocking metadata fetch; frictionless capture; MVP focus; account deletion + export as MVP requirements; no new features).
- **Actions:**
  - Archived Brief v1.0 verbatim → `docs/PRODUCT_BRIEF_v1.0.md` (history preserved).
  - Wrote **complete, internally consistent Product Brief v1.1** → `docs/PRODUCT_BRIEF.md`: all D1–D12 applied; canonical Item ingestion contract (§6); final Home/Inbox/All Items/Collections/Favorites/Trash definitions; P0 modules A–I incl. new Link-Metadata (async/SSRF) and Export (JSON+ZIP+HTML) modules; file/quota policy (25 MB / 500 MB); fa-default i18n; P1 re-ordered; expanded out-of-scope; data model v1.1; journeys J1–J6 incl. Export & Departure; metrics operationalized (organization = report-only); **DoD expanded to 16 criteria**.
  - Added `docs/CHANGELOG.md` (exact v1.0→v1.1 deltas, 18 change groups).
  - Updated `docs/DECISIONS.md`: D1–D12 ✅ APPROVED with owner wording; **new micro-gaps registered as D14 (email verification gating), D15 (URL normalization depth), D16 (quota edge behavior) — PENDING, not silently decided**; assumptions A1–A8 labeled in Brief Appendix A; E6 documented (v1.1 English working language).
  - Updated `docs/SNAPSHOT.md` to v4 (state, decisions, git-state basis) and `docs/ROADMAP.md` (Phase 0 checklist: brief/decisions/IA/journeys/metrics ✅; kickoff gate = D14–D16 + A1–A8).
- **Commits:** (1) `69e142d804b92de2b4656d3a3e86bf6a59735b9b` — `docs: product brief v1.1 (D1-D12 applied) + changelog + decisions + roadmap updates` (7 files, 886 insertions, 463 deletions; v1.0 rename preserved by git); (2) this state-recording commit (final HEAD — see live `git rev-parse HEAD`).
- **Verification evidence:** `git ls-remote backup refs/heads/main` after commit (1) = `69e142d804b92de2b4656d3a3e86bf6a59735b9b` = local HEAD — **EQUAL, parity proven**. Re-runnable via SNAPSHOT §9 commands.
- **State after step:** **No code written. No stack chosen.** Gate: awaiting owner approval of D14–D16 (+A1–A8) to start Phase 0.

### Step 3 — Persistence Protocol established; project state persisted to repository
- **Trigger:** Owner's mandatory requirement — full durability against sandbox reset/destruction; SNAPSHOT.md after every step; commit + push with verifiable SHA parity.
- **Actions:**
  - Inspected git state: branch `main`, 2 commits (latest `b214b56` = full scaffold), clean tree, **no remote configured**; verified no credentials/gh/SSH/tokens exist → external push impossible in sandbox.
  - Created `docs/` and persisted everything that previously lived only in chat: `PRODUCT_BRIEF.md` (verbatim v1.0), `PRODUCT_AUDIT_REPORT.md` (full audit), `DECISIONS.md` (D1–D12 PENDING + adopted E1–E5), `ROADMAP.md` (phases + audit deltas), `ENVIRONMENT.md` (sandbox, network limits, skill reinstall commands), `SNAPSHOT.md` (master recovery doc v3, incl. Honesty Ledger), this worklog.
  - Established standing Persistence Protocol checklist in SNAPSHOT.md §Protocol.
  - **Remote limitation handled per requirement #8:** created bare mirror `/home/z/my-project-backup.git`, added as git remote `backup`, pushed `main`; parity proof via `git ls-remote backup`. Recorded that full off-sandbox recovery requires owner-provided remote.
- **Commits:** (1) `5851a6732b117acbd23392d931d6e0f90a8262d7` — `docs: persist product foundation (brief v1.0, audit, decisions, roadmap, snapshot v3)` (7 files, 1073 insertions); (2) this state-recording commit (final HEAD — see live `git rev-parse HEAD`).
- **Verification evidence (first proof):**
  - Local HEAD after commit 1: `5851a6732b117acbd23392d931d6e0f90a8262d7`
  - `git ls-remote backup refs/heads/main`: `5851a6732b117acbd23392d931d6e0f90a8262d7`
  - Parity: **EQUAL — proven**. Re-runnable anytime via SNAPSHOT.md §9 commands.
- **State after step:** Phase 0 gate unchanged — awaiting owner decisions D1–D12. No code written.

### Step 2 — Product Brief received; Product Audit delivered
- Delivered full PM audit in chat: overall assessment, C1–C8 critical issues, M1–M10 missing requirements, UX/IA recommendations, revised MVP scope (P0 keep/add, P1 re-prioritization), AD1–AD12 architecture decisions, next steps, and **D1–D12 decision list awaiting owner approval**.
- Now persisted in `docs/PRODUCT_AUDIT_REPORT.md`.

### Step 1 — Environment preparation (owner-approved setup task)
- UI Pro Max: `uipro-cli@2.2.3` installed globally; requested command `uipro init --ai universal --global` **fails** in this CLI (no `--global`, no `universal` — verified). Adapted: `--ai codex` in temp dir → copied skill to `~/.agents/skills/ui-ux-pro-max/`. Functional test passed (`search.py` returns results). Bundled assets used (GitHub download rate-limited).
- Impeccable v4.8.0: `npx skills add pbakaus/impeccable -g -y` — CLI timed out at 180s on api.github.com 403 **after** full download; skill complete in `~/.agents/skills/impeccable/`; functional tests passed (`impeccable --version` → 4.8.0; `impeccable context` → exit 0). `skills list -g` shows impeccable linked to ZCode; ui-ux-pro-max untracked (cosmetic only).
- Project untouched (no project-level artifacts). Details: `docs/ENVIRONMENT.md` §4; decisions E1/E2.

---

## Baseline (pre-session)

- Sandbox scaffold committed by platform: Next.js 16 + TS + Tailwind 4 + shadcn/ui + Prisma/SQLite demo (`b214b56` and initial commit).

---

## Session: Firebase Auth + Cloud Firestore integration (TeleVault phase 2)

### Scope
Completed and verified real Firebase Authentication + Cloud Firestore persistence for the
Savedbox/TeleVault app. No UI redesign, no new product features; data layer + auth gate only.

### New files
- `src/services/firebase.ts` — Firebase init from `NEXT_PUBLIC_FIREBASE_*` env vars; emulator hook-up (Auth :9099 / Firestore :8080); verified-UID accessor.
- `src/domain/types.ts` — Firestore document schemas (NoteDoc/CategoryDoc/TagDoc/ProfileDoc) + re-export of shared DTOs.
- `src/services/repository.ts` — Firestore CRUD for notes/categories/tags/profile/stats under `users/{uid}/…`; UID always derived from verified Auth state (never from callers).
- `src/services/data-source.ts` — dual-mode dispatch: Firestore for authenticated users, local demo API (Prisma sample data) otherwise.
- `src/hooks/use-auth.tsx` — AuthProvider (loading/error/logout, demo-mode flag, error-code→i18n mapping).
- `src/components/app/auth-gate.tsx` — sign-in/sign-up + explicitly labeled demo entry.
- `firestore.rules` — per-user isolation + document validation (owner-only writes, field/type/length caps, immutable savedAt/createdAt, no profile deletion, catch-all deny).
- `firestore.indexes.json`, `firebase.json`, `.firebaserc` — emulator/project config (local dev project `televault-dev`).
- `scripts/rules-test.ts` — 39 security assertions vs the emulator (39/39 pass).
- `scripts/e2e-verify.sh` — agent-browser E2E for scenarios 1-10 (15/15 pass).

### Modified files
- `src/hooks/queries.ts` — UID-scoped cache keys + dispatch through data-source.
- `src/components/app/providers.tsx` (+AuthProvider), `app-shell.tsx` (splash + gate), `header.tsx` (account chip / demo badge), `views/settings-view.tsx` (AccountCard, mode-aware export/reset), `note-detail-sheet.tsx` (tag creation via data-source), `src/lib/i18n/dictionaries.ts` (auth.* keys fa+en), `package.json` (firebase deps + emulators script), `bun.lock`.

### Verification (all against Firebase Emulator Suite — NOT production cloud)
- Rules: 39/39 (cross-user denial, unauthenticated denial, owner CRUD, 15 validation rejections).
- Browser E2E: 15/15 (account create, note create, refresh persistence, edit, delete, category+tag, logout/login, data intact, two-user isolation, auth error paths). Screenshots: /tmp/e2e/*.png.
- Lint clean; tsc clean (app code). Zero browser console errors during E2E.

### Configuration status (honest)
- `.env` currently holds EMULATOR placeholders (`NEXT_PUBLIC_FIREBASE_EMULATOR=true`, project `televault-dev`). No real Firebase project credentials exist in this sandbox — production cloud persistence is NOT verified and remains blocked on real `NEXT_PUBLIC_FIREBASE_*` values from the owner's Firebase console.
- Emulator limitation discovered: Firestore Emulator v1.22.0 rules engine does not support list iteration (`list.all/any`) at runtime → tag-array element shape is enforced by the repository + documented in rules (size cap only).
