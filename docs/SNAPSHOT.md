# SNAPSHOT — Personal Knowledge Manager

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 5 · **Date:** 2026-11-04 · **Snapshot author:** Z.ai Code agent

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | Personal Knowledge Manager (PKM) web app — "Capture First, Organize Later" |
| Brief | **v1.2 APPROVED** (`docs/PRODUCT_BRIEF.md`; v1.0 archived at `docs/PRODUCT_BRIEF_v1.0.md`; deltas `docs/CHANGELOG.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) |
| Decisions | **D1–D12 APPROVED (§A) + D14–D16 final rulings APPROVED (§A2) + five binding instructions — all 2026-11-04** (`docs/DECISIONS.md`) |
| **Current gate** | **Phase 0 AUTHORIZED by owner (scoped mandate)** — design work starts only after owner approves `docs/PHASE0_CHECKLIST.md` (presented as DRAFT, awaiting review). No code/UI/stack selection until then — and no application code until Phase 2/3 regardless. |
| Development status | **NOT STARTED** — codebase is the pristine Next.js scaffold + documentation. Intentional. |
| Next allowed step | Upon owner approval of the Phase 0 checklist: execute W1–W6 (`docs/PHASE0_CHECKLIST.md` §5) — IA validation, personas, UX requirements, journey validation, design foundations, wireframe plans for the 4 approved core screens (Quick Capture, Library, Item Detail, Search). Design/UX documentation only. |

## 2. Implemented Capabilities

**None.** No product feature exists yet. The codebase is the original sandbox scaffold:

- `src/app/page.tsx` — scaffold demo landing page (the only user-visible route)
- `src/app/api/route.ts` — scaffold demo `GET /api` returning `{ message: "Hello, world!" }`
- `prisma/schema.prisma` — scaffold demo models `User` / `Post` (to be replaced by PKM schema per Brief §9 in Phase 2)
- `db/custom.db` — empty scaffold SQLite runtime DB
- Full shadcn/ui component set in `src/components/ui/` (New York style, ~45 components) — available, unused
- `mini-services/`, `examples/`, `.zscripts/` — sandbox platform scaffolding, untouched

## 3. Architecture & Technical Contracts (established platform rules — binding for future development)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route visible to users: `/` (`src/app/page.tsx`). No other pages until development phases define them.
- **Styling:** Tailwind CSS 4 + shadcn/ui (use existing components; do not rebuild). No indigo/blue colors unless owner requests. Responsive, mobile-first mandatory. Sticky footer rule: root wrapper `min-h-screen flex flex-col`, footer `mt-auto`.
- **Data:** Prisma ORM + SQLite only (`db/custom.db`). Schema in `prisma/schema.prisma`. Apply with `bun run db:push`. Client via `import { db } from '@/lib/db'`.
- **API pattern:** use API routes (`src/app/api/**`), **not** server actions.
- **AI SDK:** `z-ai-web-dev-sdk` server-side only (API routes / mini services).
- **State:** Zustand (client) + TanStack Query (server state) available in package.json.
- **Realtime (if ever needed):** socket.io as a separate mini service on its own port; frontend connects via `io("/?XTransformPort={port}")`, path `/`, never direct ports.
- **Dev/ops:** `bun run dev` (port 3000, logs → `dev.log`); never `bun run build` in sandbox; single external port via Caddy gateway (`?XTransformPort=`).
- **Product-level technical contracts (owner-mandated, binding for Phase 2 design):** Canonical Item ingestion contract (Brief §6) · async non-blocking link metadata fetch with SSRF protections (Brief §7-C) · file constraints 25 MB/file + 500 MB configurable quota; quota edge = uploads-only block, notes/links unaffected (D16, Brief §7) · fa-default i18n/RTL from day one (Brief §10) · email verification = soft nudge, verified email required for export, identity re-authentication for account deletion (D14, Brief §7-A) · duplicate normalization strips known trackers only — `utm_*`, `fbclid`, `gclid` (D15, Brief §9) · export JSON+ZIP mandatory, HTML conditional on A1 cost validation (Brief §7-H) · account deletion with full erasure as P0 (Brief §7-A).
- Full environment detail: `docs/ENVIRONMENT.md`.

## 4. Product Decisions State

- **D1–D12 (product): APPROVED 2026-11-04** — applied to Brief v1.1 with owner's six mandatory clarifications. `docs/DECISIONS.md` §A.
- **D14–D16 (final rulings): APPROVED 2026-11-04** — D14 soft email verification (verified email for export; re-auth for deletion) · D15 controlled tracking-param stripping (`utm_*`, `fbclid`, `gclid` only) · D16 quota blocks uploads only, notes/links savable. Applied to Brief v1.2. `docs/DECISIONS.md` §A2.
- **Owner binding instructions (5):** silence ≠ approval for assumptions · HTML export conditional · dark mode outside mandatory MVP unless explicitly in approved brief · preserve boundaries / no new features · update DECISIONS+Brief only with rulings. `docs/DECISIONS.md` §A2.
- **D17 (dark-mode scope confirmation): PENDING** — one-line ruling requested with the Phase 0 checklist review (factual check recorded: approved brief lists Light/Dark in §7-I, §10, DoD #11; nothing silently kept or removed).
- **A1–A8 (assumptions): explicitly UNRESOLVED** — silence ≠ approval (owner instruction 1); individual review scheduled as Phase 0 work item W7 and Phase 0 exit-gate criterion. A6 superseded by D15 (recorded).
- **D13 (environment): PENDING** — owner-provided external git remote for true off-sandbox recovery.
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
| Git remote (GitHub/GitLab) | ❌ NONE (D13 pending) | No credentials/tokens/SSH in sandbox | Owner provides URL + credentials → `git remote add origin <URL> && git push -u origin main` (`docs/ENVIRONMENT.md` §5) |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only | Sandbox has no external git host access | `/home/z/my-project-backup.git` — survives project-dir loss, NOT total sandbox destruction |
| `~/.agents/skills/*` (UI Pro Max, Impeccable) | ⚠️ Outside repo | Skills install to home dir by design | Reinstall commands in `docs/ENVIRONMENT.md` §4 (verified working) |
| `db/custom.db` contents | ⚠️ Scaffold-only | Runtime DB, scaffold demo data only, disposable | Recreated by `bun run db:push` |
| Dev server process, env runtime | ⚠️ Not persistent | Process state | `bun run dev` |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/audit/brief/changelog/checklist persisted in `docs/` |

**Acceptance criterion status: PARTIALLY met** — code + all decisions + all documents survive via the repository; the two skills and the external remote require documented recovery actions (skills: commands provided; remote: owner must supply, D13). No false claim of full recovery is made.

## 9. Git State (verify live with the commands below — a commit cannot contain its own SHA)

| Field | Value at snapshot v5 |
|---|---|
| Branch | `main` |
| Working tree | clean at last check |
| v1.2 content commit | see `git log` — message `docs: apply final rulings D14-D16 (brief v1.2) + phase 0 entry checklist draft` |
| State-recording commit | final HEAD — see live `git rev-parse HEAD` |
| Remote `origin` | **NONE** (D13 pending — owner must provide) |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git`; parity proven at each step (evidence: `worklog.md`) |

Authoritative live check:

```bash
git rev-parse HEAD && git status --short && git ls-remote backup | grep refs/heads/main
# local HEAD must equal backup/main SHA
```

## 10. Recovery Procedure (fresh environment, no chat history)

1. Obtain the repository (once owner provides remote: `git clone <URL>`; from sandbox mirror: `git clone /home/z/my-project-backup.git my-project`).
2. Read in this order: this file → `docs/DECISIONS.md` → `docs/PRODUCT_BRIEF.md` (+ `CHANGELOG.md`) → `docs/PHASE0_CHECKLIST.md` → `docs/PRODUCT_AUDIT_REPORT.md` → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `worklog.md`.
3. `bun install`
4. `bun run db:push` (recreates SQLite from `prisma/schema.prisma`)
5. Reinstall AI skills if needed: `docs/ENVIRONMENT.md` §4.
6. `bun run dev` → port 3000; check `dev.log`.
7. Resume from §1 "Next allowed step". If the Phase 0 checklist is still DRAFT/unapproved in `docs/PHASE0_CHECKLIST.md`, **do not start design work** — request the owner's review.

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep: UI Pro Max + Impeccable installed globally & functionally verified (E1, E2).
2. Product Brief v1.0 received; full PM audit delivered (C1–C8, M1–M10, AD1–AD12, D1–D12).
3. Persistence Protocol established (E3/E4): docs/ created; Brief v1.0 + Audit + Decisions + Roadmap + Environment + Snapshot + worklog persisted; mirror `backup` remote with proven parity.
4. Owner approved D1–D12 + six mandatory clarifications → Product Brief v1.1 produced; assumptions A1–A8 labeled; new open decisions D14–D16 registered. CHANGELOG.md added.
5. **Owner issued final rulings D14–D16 + five binding instructions + scoped Phase 0 authorization → Brief v1.2 produced (targeted deltas only); DECISIONS.md §A2 added; D17 (dark-mode scope) registered pending; `docs/PHASE0_CHECKLIST.md` created (DRAFT, presented for owner review); ROADMAP Phase 0 rebuilt around the authorized scope; SNAPSHOT v5.** No design work started — gated on checklist approval.

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
6. [ ] Push to every configured remote (`backup` today; `origin` once owner provides it, D13) and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`.
7. [ ] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [ ] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely.

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote (once it exists) + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress.
