# SNAPSHOT — Personal Knowledge Manager

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 7 · **Date:** 2026-11-04 · **Snapshot author:** Z.ai Code agent

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | Personal Knowledge Manager (PKM) web app — "Capture First, Organize Later" |
| Brief | **v1.2 APPROVED** (`docs/PRODUCT_BRIEF.md`; v1.0 archived at `docs/PRODUCT_BRIEF_v1.0.md`; deltas `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | **D1–D12 APPROVED (§A) + D14–D16 final rulings APPROVED (§A2) + five binding instructions + D13 APPROVED & DONE (external GitHub backup)** — all 2026-11-04 (`docs/DECISIONS.md`) |
| External backup | ✅ **`origin` = `https://github.com/Sohrab1999/Savedmassagemanager1` (public)** — full history pushed; parity **independently re-verified via credential-free channels** (anonymous `ls-remote` + fresh anonymous clone, 2026-11-04); `origin` push temporarily **blocked** (no credential in sandbox — security closure; owner to supply new PAT); secondary same-fs mirror `backup` maintained |
| **Current gate** | **Phase 0 AUTHORIZED by owner (scoped mandate)** — design work starts only after owner approves `docs/PHASE0_CHECKLIST.md` (presented as DRAFT, awaiting review). No code/UI/stack selection until then — and no application code until Phase 2/3 regardless. |
| Development status | **NOT STARTED** — codebase is the pristine Next.js scaffold + documentation. Intentional. |
| Next allowed step | Upon owner approval of the Phase 0 checklist: execute W1–W6 (`docs/PHASE0_CHECKLIST.md` §5) — IA validation, personas, UX requirements, journey validation, design foundations, wireframe plans for the 4 approved core screens (Quick Capture, Library, Item Detail, Search). Design/UX documentation only. |

## 2. Implemented Capabilities

**None.** No product feature exists yet. The codebase is the original sandbox scaffold:

- `src/app/page.tsx` — scaffold demo landing page (the only user-visible route)
- `src/app/api/route.ts` — scaffold demo `GET /api` returning `{ message: "Hello, world!" }`
- `prisma/schema.prisma` — scaffold demo models `User` / `Post` (to be replaced by PKM schema per Brief §9 in Phase 2)
- `db/custom.db` — local SQLite runtime DB (**untracked** since 2026-11-04; recreated by `bun run db:push`)
- Full shadcn/ui component set in `src/components/ui/` (New York style, ~45 components) — available, unused
- `mini-services/`, `examples/`, `.zscripts/` — sandbox platform scaffolding, untouched

## 3. Architecture & Technical Contracts (established platform rules — binding for future development)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route visible to users: `/` (`src/app/page.tsx`). No other pages until development phases define them.
- **Styling:** Tailwind CSS 4 + shadcn/ui (use existing components; do not rebuild). No indigo/blue colors unless owner requests. Responsive, mobile-first mandatory. Sticky footer rule: root wrapper `min-h-screen flex flex-col`, footer `mt-auto`.
- **Data:** Prisma ORM + SQLite only (`db/custom.db`, **untracked**). Schema in `prisma/schema.prisma`. Apply with `bun run db:push`. Client via `import { db } from '@/lib/db'`. Fresh clone needs `.env` with `DATABASE_URL=file:/home/z/my-project/db/custom.db` (`docs/ENVIRONMENT.md` §6).
- **API pattern:** use API routes (`src/app/api/**`), **not** server actions.
- **AI SDK:** `z-ai-web-dev-sdk` server-side only (API routes / mini services).
- **State:** Zustand (client) + TanStack Query (server state) available in package.json.
- **Realtime (if ever needed):** socket.io as a separate mini service on its own port; frontend connects via `io("/?XTransformPort={port}")`, path `/`, never direct ports.
- **Dev/ops:** `bun run dev` (port 3000, logs → `dev.log`); never `bun run build` in sandbox; single external port via Caddy gateway (`?XTransformPort=`).
- **Git/backup policy:** after every step push `main` to **every** remote (`origin` + `backup`) and prove SHA parity. Credentials only via `~/.git-credentials` outside the repo; never embed tokens in remote URLs or files. **Current state: credential store intentionally EMPTY (security closure 2026-11-04) — `origin` push blocked until the owner supplies a new credential; `backup` parity always provable** (`docs/ENVIRONMENT.md` §5).
- **Product-level technical contracts (owner-mandated, binding for Phase 2 design):** Canonical Item ingestion contract (Brief §6) · async non-blocking link metadata fetch with SSRF protections (Brief §7-C) · file constraints 25 MB/file + 500 MB configurable quota; quota edge = uploads-only block, notes/links unaffected (D16, Brief §7) · fa-default i18n/RTL from day one (Brief §10) · email verification = soft nudge, verified email required for export, identity re-authentication for account deletion (D14, Brief §7-A) · duplicate normalization strips known trackers only — `utm_*`, `fbclid`, `gclid` (D15, Brief §9) · export JSON+ZIP mandatory, HTML conditional on A1 cost validation (Brief §7-H) · account deletion with full erasure as P0 (Brief §7-A).
- Full environment detail: `docs/ENVIRONMENT.md`.

## 4. Product Decisions State

- **D1–D12 (product): APPROVED 2026-11-04** — applied to Brief v1.1 with owner's six mandatory clarifications. `docs/DECISIONS.md` §A.
- **D14–D16 (final rulings): APPROVED 2026-11-04** — D14 soft email verification (verified email for export; re-auth for deletion) · D15 controlled tracking-param stripping (`utm_*`, `fbclid`, `gclid` only) · D16 quota blocks uploads only, notes/links savable. Applied to Brief v1.2. `docs/DECISIONS.md` §A2.
- **Owner binding instructions (5):** silence ≠ approval for assumptions · HTML export conditional · dark mode outside mandatory MVP unless explicitly in approved brief · preserve boundaries / no new features · update DECISIONS+Brief only with rulings. `docs/DECISIONS.md` §A2.
- **D17 (dark-mode scope confirmation): PENDING** — one-line ruling requested with the Phase 0 checklist review (factual check recorded: approved brief lists Light/Dark in §7-I, §10, DoD #11; nothing silently kept or removed).
- **A1–A8 (assumptions): explicitly UNRESOLVED** — silence ≠ approval (owner instruction 1); individual review scheduled as Phase 0 work item W7 and Phase 0 exit-gate criterion. A6 superseded by D15 (recorded).
- **D13 (external backup): ✅ APPROVED & DONE 2026-11-04** — owner provided `https://github.com/Sohrab1999/Savedmassagemanager1` (public); configured as `origin`; complete history pushed; parity verified. Credential stored outside the repo; rotation recommended. **Re-verified 2026-11-04 via credential-free channels (anonymous ls-remote + fresh anonymous clone → `main = e5898b2…`); "empty" displays diagnosed as API-rate-limit checker artifact; exposed chat-shared PAT removed from the local credential store, revocation pending owner action; origin push blocked until a new credential is supplied.**
- **AD1–AD12 (architecture): OPEN** — resolved in Phase 2 Technical Architecture Document, after Phase 0. Deliberately no stack selected.

## 5. Data Structure

Current runtime schema = scaffold demo (User/Post) — **no PKM schema exists yet**. Target product-level model is Brief §9 (Item with `content_type` enum `note|link|image|file`, `mime_type`, `file_size`, `thumbnail_url`, `metadata_status`, soft delete; Collection/Tag unique-per-user; ItemCollection/ItemTag composite-key join tables for multi-membership D1; file cardinality 0..1 per D12; duplicate normalization per D15). Storage implementation decision = AD1 (Phase 2).

## 6. Dependencies

Key runtime deps (authoritative list in `package.json`): next 16.1.1, react 19, prisma 6.11.1 + @prisma/client, next-auth 4.24.11 (available, unused), next-intl 4.3.4 (available, unused — candidate for D2/AD9), next-themes, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix UI set via shadcn/ui, z-ai-web-dev-sdk 0.0.18. Install with `bun install`.

## 7. Tests & Quality Status

- **No application tests exist** (owner instruction: no test code). `tests/` contains sandbox runtime-build shell scripts (platform-owned, unrelated to app testing).
- **Lint baseline:** not yet established — first `bun run lint` has not been run this session. Run before first code change and record the result here.
- **Browser verification:** not applicable yet (no features). Will become mandatory for every dev step per platform rules (Agent Browser end-to-end self-verification).

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| External git backup (`origin`) | ✅ **ACTIVE & independently re-verified 2026-11-04** — `https://github.com/Sohrab1999/Savedmassagemanager1` (public) | D13 resolved by owner; re-verified anonymously (`main = e5898b2…`, fresh clone OK) | "empty"-display reports = API checker artifact (ENVIRONMENT §2); repo was empty before first push (nothing overwritten) |
| Push credential | 🚫 **REMOVED from sandbox 2026-11-04 (security closure)** — store now empty | Chat-exposed PAT must be revoked by owner; reuse prohibited; `git credential store` is plaintext (GCM recommended on Windows) | Owner revokes old PAT → issues fine-grained PAT (this repo, `Contents: R/W`) → load via `git credential approve` one-liner (ENVIRONMENT §5); until then origin push is blocked |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only; **currently the only remote holding the newest commit(s)** | Redundant convenience copy; origin push blocked (security closure) | Survives project-dir loss, not total sandbox destruction — `origin` becomes durable again once the owner restores a credential |
| `~/.agents/skills/*` (UI Pro Max, Impeccable) | ⚠️ Outside repo | Skills install to home dir by design | Reinstall commands in `docs/ENVIRONMENT.md` §4 (verified working) |
| `db/custom.db` contents | ⚠️ Local runtime file (untracked) | Runtime DB, scaffold demo data only, disposable | Recreated by `bun run db:push`; needs `.env` (§3) |
| Dev server process, env runtime | ⚠️ Not persistent | Process state | `bun run dev` |
| Public-visibility note | ℹ️ `origin` repo is **public** (proven 2026-11-04: anonymous clone + web pages HTTP 200, no auth) | Owner-created repo; no secrets in repo/history/mirror (re-scanned 2026-11-04) | Owner may flip to private in GitHub settings at any time; docs contain no credentials by design |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/audit/brief/changelog/checklist persisted in `docs/` |

**Acceptance criterion status: MET for the repository up to `e5898b2`** — code + complete history + all decisions + all product documents (incl. SNAPSHOT v6) are on the public GitHub remote and were **successfully recovered in a fresh anonymous clone** (verified 2026-11-04, no credentials, separate temp directory). The only content newer than `e5898b2` is this verification report itself (snapshot v7 delta), held on `backup` until the owner restores a push credential. Non-repo artifacts (skills, runtime DB, dev server, push credential) have documented recovery actions. No false claim is made beyond this.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v7 |
|---|---|
| Branch | `main` (only branch) |
| Working tree | clean at last check |
| Remote `origin` | `https://github.com/Sohrab1999/Savedmassagemanager1` (public) — **verified anonymously: `main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`**; push currently **blocked** (no credential in sandbox — security closure) |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git` — push verified every step |
| Last SHA proven on origin | `e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea` (= parent of this snapshot; contains ALL product docs + complete history + SNAPSHOT v6) |
| Pending on origin | exactly this verification-report delta (snapshot v7 + worklog Step 7 + ENVIRONMENT §2/§5 + DECISIONS D13 status) — on `backup` now; pushed to `origin` as soon as the owner restores a credential |
| Final HEAD | see live `git rev-parse HEAD` |

Authoritative live check:

```bash
git rev-parse HEAD && git status --short \
 && git ls-remote backup refs/heads/main \
 && GIT_TERMINAL_PROMPT=0 GIT_ASKPASS=true git -c credential.helper= ls-remote https://github.com/Sohrab1999/Savedmassagemanager1.git refs/heads/main
# backup/main must equal local HEAD (pushed every step);
# origin is checked ANONYMOUSLY (no credential exists in the sandbox — security closure) and shows its true current state
```

## 10. Recovery Procedure (fresh environment, no chat history)

1. `git clone https://github.com/Sohrab1999/Savedmassagemanager1.git my-project` (public read; push credential per `docs/ENVIRONMENT.md` §5).
2. Read in this order: this file → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/PHASE0_CHECKLIST.md` → `docs/PRODUCT_AUDIT_REPORT.md` → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `worklog.md`.
3. `bun install` · create `.env` (`DATABASE_URL=file:/home/z/my-project/db/custom.db`) · `bun run db:push`.
4. Reinstall AI skills if needed: `docs/ENVIRONMENT.md` §4.
5. `bun run dev` → port 3000; check `dev.log`.
6. Resume from §1 "Next allowed step". If the Phase 0 checklist is still DRAFT/unapproved in `docs/PHASE0_CHECKLIST.md`, **do not start design work** — request the owner's review.

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep: UI Pro Max + Impeccable installed globally & functionally verified (E1, E2).
2. Product Brief v1.0 received; full PM audit delivered (C1–C8, M1–M10, AD1–AD12, D1–D12).
3. Persistence Protocol established (E3/E4): docs/ created; all foundation docs persisted; mirror `backup` remote with proven parity.
4. Owner approved D1–D12 + six mandatory clarifications → Product Brief v1.1 produced; A1–A8 labeled; D14–D16 registered.
5. Owner issued final rulings D14–D16 + five binding instructions + scoped Phase 0 authorization → Brief v1.2; DECISIONS §A2; D17 registered pending; `docs/PHASE0_CHECKLIST.md` created (DRAFT, awaiting owner review); SNAPSHOT v5. No design work — gated on checklist approval.
6. **D13 resolved by owner: GitHub origin configured & pushed.** Auth state inspected (no gh CLI → git credential store used, outside repo, 0600) · repo verified public + **empty** before push (nothing overwritten) · **secret-hygiene commit `55c04e3`** (untracked `.env` + `db/custom.db`; `.gitignore` +`/db/`,`*.db`) · **full-history secret scan clean** (no PATs/API keys/private keys/AWS keys; `.env` was a benign local path; PAT confirmed absent from tree & history) · complete history pushed to `origin` + `backup` · SHA parity proven on both · docs updated (ENVIRONMENT §2/§5/§6/§7, DECISIONS D13 row only, SNAPSHOT v6, worklog).
7. **Owner challenged the backup ("This repository is empty."); independent re-verification ordered.** Verdict: parity claim **CONFIRMED** via credential-free channels — anonymous `git ls-remote` (`main = e5898b2…`), fresh anonymous clone in /tmp (11 commits, all required docs, clean `fsck`), repo/commit web pages HTTP 200, raw content served; **"empty" display diagnosed as API-rate-limit/409 checker artifact** (ENVIRONMENT §2). **Security closure:** the single plaintext stored credential REMOVED (store now empty); PAT proven absent from repo/history/mirror/logs; plaintext-store risk + GCM recommendation documented; revocation pending owner; **origin push blocked until a new credential** — honest deltas recorded in §8/§9. SNAPSHOT v7, worklog Step 7, ENVIRONMENT §2/§5, DECISIONS D13 status line.

## 12. Remaining Work

See `docs/ROADMAP.md` (single source for phases/checkboxes). Immediate: owner review of `docs/PHASE0_CHECKLIST.md` (+ optional D17 one-liner) → Phase 0 W1–W6 → W7 (A1–A8 individual review + D17 + exit package) → Phase 1 prototype → Phase 2 architecture (AD1–AD12) → build.

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [ ] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump + date).
2. [ ] Affected reference docs updated: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `docs/ENVIRONMENT.md`, `docs/PRODUCT_*.md`, `worklog.md`.
3. [ ] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA.
4. [ ] `git status` reviewed before commit — no essential file left untracked/unstaged; nothing essential only in temp locations.
5. [ ] Commit with a descriptive message.
6. [ ] Push to **every** configured remote (`origin` = GitHub + `backup` = local mirror) and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`.
7. [ ] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [ ] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely. **Never store credentials in the repository.**

**Acceptance criterion:** if this sandbox is destroyed right now, cloning `origin` + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress.
