# SNAPSHOT — Personal Knowledge Manager

> **MASTER RECOVERY DOCUMENT.** A fresh environment with no access to this sandbox and no chat history must be able to reconstruct exact project state from this repository alone. Update this file **completely** (not a summary append) at the end of every step, per the Persistence Protocol (§Protocol).
>
> **Snapshot version:** 3 · **Date:** 2026-11-04 · **Snapshot author:** Z.ai Code agent

---

## 1. Project Identity & Current Gate

| Field | Value |
|---|---|
| Product | Personal Knowledge Manager (PKM) web app — "Capture First, Organize Later" |
| Brief | v1.0 received 2026-11-04 (verbatim: `docs/PRODUCT_BRIEF.md`) |
| Audit | Delivered 2026-11-04 (`docs/PRODUCT_AUDIT_REPORT.md`) — verdict: conditionally approved |
| **Current gate** | **Awaiting owner approval of D1–D12** (`docs/DECISIONS.md` §A) |
| Development status | **NOT STARTED** — codebase is the pristine Next.js scaffold + documentation. This is intentional per owner's gate. |
| Next allowed step | After D1–D12 approval: (1) Brief v1.1 delta patch, (2) Phase 0 completion (persona, journeys, IA definitions, metric definitions), per `docs/ROADMAP.md`. **Do not start UI/code before that.** |

## 2. Implemented Capabilities

**None.** No product feature exists yet. The codebase is the original sandbox scaffold:

- `src/app/page.tsx` — scaffold demo landing page (the only user-visible route)
- `src/app/api/route.ts` — scaffold demo `GET /api` returning `{ message: "Hello, world!" }`
- `prisma/schema.prisma` — scaffold demo models `User` / `Post` (to be replaced by PKM schema in Phase 2)
- `db/custom.db` — empty scaffold SQLite runtime DB
- Full shadcn/ui component set in `src/components/ui/` (New York style, ~45 components) — available, unused
- `mini-services/`, `examples/`, `.zscripts/` — sandbox platform scaffolding, untouched

Product decisions D1–D12 are **PENDING**; architecture decisions AD1–AD12 are **OPEN**. Nothing has been chosen or built.

## 3. Architecture & Technical Contracts (established platform rules — binding for future development)

- **Framework:** Next.js 16 App Router + TypeScript 5 (non-negotiable). Only route visible to users: `/` (`src/app/page.tsx`). No other pages.
- **Styling:** Tailwind CSS 4 + shadcn/ui (use existing components; do not rebuild). No indigo/blue colors unless owner requests. Responsive, mobile-first mandatory. Sticky footer rule: root wrapper `min-h-screen flex flex-col`, footer `mt-auto`.
- **Data:** Prisma ORM + SQLite only (`db/custom.db`). Schema in `prisma/schema.prisma`. Apply with `bun run db:push`. Client via `import { db } from '@/lib/db'`.
- **API pattern:** use API routes (`src/app/api/**`), **not** server actions.
- **AI SDK:** `z-ai-web-dev-sdk` server-side only (API routes / mini services).
- **State:** Zustand (client) + TanStack Query (server state) available in package.json.
- **Realtime (if ever needed):** socket.io as a separate mini service on its own port; frontend connects via `io("/?XTransformPort={port}")`, path `/`, never direct ports.
- **Dev/ops:** `bun run dev` (port 3000, logs → `dev.log`); never `bun run build` in sandbox; single external port via Caddy gateway (`?XTransformPort=`).
- Full environment detail: `docs/ENVIRONMENT.md`.

## 4. Product Decisions State

- **D1–D12 (product): PENDING** — definitions + options + recommendations in `docs/DECISIONS.md` §A and `docs/PRODUCT_AUDIT_REPORT.md` §8. Owner has NOT approved any of them yet. Any answer like "approve all recommendations" adopts the 💡 recommendation column as APPROVED.
- **AD1–AD12 (architecture): OPEN** — deliberately unresolved until after D1–D12 (see audit §6 for why each matters and its Telegram/future implication).
- **E1–E5 (process/environment): ADOPTED** — see `docs/DECISIONS.md` §B.

## 5. Data Structure

Current runtime schema = scaffold demo (User/Post) — **no PKM schema exists yet**. The target data model is Brief §9 (Item/Collection/Tag/ItemCollection/ItemTag) plus audit deltas (§4 of audit: content_type enum proposal `note|link|image|file`, `mime_type`, `file_size`, `thumbnail_url`, unique constraints, `updated_at` on Collection/Tag), final shape gated on D1/D7/D8/D12 and AD1/AD3.

## 6. Dependencies

Key runtime deps (see `package.json` for the authoritative list): next 16.1.1, react 19, prisma 6.11.1 + @prisma/client, next-auth 4.24.11 (available, unused), next-intl 4.3.4 (available, unused — relevant to D2/AD9), next-themes, zustand, @tanstack/react-query + react-table, framer-motion, tailwindcss 4, full Radix UI set via shadcn/ui, z-ai-web-dev-sdk 0.0.18. Install with `bun install`.

## 7. Tests & Quality Status

- **No application tests exist** (owner instruction: no test code). `tests/` contains sandbox runtime-build shell scripts (platform-owned, unrelated to app testing).
- **Lint baseline:** not yet established for the scaffold — first `bun run lint` has not been run this session. Run before first code change and record the result here.
- **Browser verification:** not applicable yet (no features). Will become mandatory for every dev step per platform rules (Agent Browser end-to-end self-verification).

## 8. Limitations & Honesty Ledger (what this repo can NOT restore alone)

| Item | Status | Cause | Recovery |
|---|---|---|---|
| Git remote (GitHub/GitLab) | ❌ NONE | No credentials/tokens/SSH in sandbox | Owner must provide remote URL + credentials, then `git remote add origin <URL> && git push -u origin main` (`docs/ENVIRONMENT.md` §5) |
| Bare mirror `backup` remote | ⚠️ Same-filesystem only | Sandbox has no external git host access | `git remote add backup /home/z/my-project-backup.git && git push backup main` — survives project-dir loss, NOT total sandbox destruction |
| `~/.agents/skills/*` (UI Pro Max, Impeccable) | ⚠️ Outside repo | Skills install to home dir by design | Reinstall commands in `docs/ENVIRONMENT.md` §4 (verified working) |
| `db/custom.db` contents | ⚠️ Scaffold-only | Runtime DB, scaffold demo data only, disposable | Recreated by `bun run db:push` |
| Dev server process, env runtime | ⚠️ Not persistent | Process state | `bun run dev` |
| Chat-only knowledge | ✅ Eliminated | — | All decisions/audit/brief persisted in `docs/` (this was the point of the Persistence Protocol) |

**Therefore the acceptance criterion ("sandbox destroyed → clone remote → full recovery") is PARTIALLY met:** code + all decisions + all documents survive via the repository; the two skills and the external remote require the documented recovery actions (skills: commands provided; remote: owner must supply). No false claim of full recovery is made.

## 9. Git State (updated at snapshot time — verify live with commands below)

| Field | Value at snapshot v3.1 |
|---|---|
| Branch | `main` |
| Working tree | clean at last check (all essential files committed) |
| Content commit (all docs + scaffold baseline) | `5851a6732b117acbd23392d931d6e0f90a8262d7` — `docs: persist product foundation (brief v1.0, audit, decisions, roadmap, snapshot v3)` |
| Final state-recording commit | this commit (worklog/snapshot SHA recording) — see live `git rev-parse HEAD` |
| Remote `origin` | **NONE** (limitation §8 — owner must provide) |
| Remote `backup` | bare mirror `/home/z/my-project-backup.git`; `main` pushed; parity for `5851a67` **proven equal** via `git ls-remote backup` (evidence in `worklog.md` Step 3) |

Because a commit cannot contain its own SHA, the authoritative live check is:

```bash
git rev-parse HEAD && git status --short && git ls-remote backup | grep refs/heads/main
# local HEAD must equal backup/main SHA
```

## 10. Recovery Procedure (fresh environment, no chat history)

1. Obtain the repository (once owner provides remote: `git clone <URL>`; from sandbox mirror: `git clone /home/z/my-project-backup.git my-project`).
2. Read in this order: this file → `docs/DECISIONS.md` → `docs/PRODUCT_AUDIT_REPORT.md` → `docs/ROADMAP.md` → `docs/ENVIRONMENT.md` → `worklog.md`.
3. `bun install`
4. `bun run db:push` (recreates SQLite from `prisma/schema.prisma`)
5. Reinstall AI skills if needed: `docs/ENVIRONMENT.md` §4.
6. `bun run dev` → port 3000; check `dev.log`.
7. Resume from §1 "Next allowed step". If D1–D12 are still PENDING in `docs/DECISIONS.md`, **do not build** — request the owner's decisions.

## 11. Work Completed (chronological, details in `worklog.md`)

1. Environment prep: UI Pro Max + Impeccable installed globally & functionally verified (E1, E2).
2. Product Brief v1.0 received; full PM audit delivered (C1–C8, M1–M10, UX/IA recs, revised MVP, AD1–AD12, D1–D12) — status: awaiting owner decisions.
3. Persistence Protocol established (E3/E4): docs/ created, Brief + Audit + Decisions + Roadmap + Environment + this Snapshot + worklog persisted; first mirrored commits made.

## 12. Remaining Work

See `docs/ROADMAP.md` (single source for phases/checkboxes). Immediate: D1–D12 approval → Brief v1.1 → Phase 0 completion.

---

## §Protocol — Persistence Protocol (STANDING RULE, every step, non-negotiable)

Owner mandate 2026-11-04: after **every** step, no approved change/decision/doc/progress may live only in chat memory, chat output, temp files, or the sandbox.

Checklist (all items mandatory, evidence-based):

1. [ ] `docs/SNAPSHOT.md` fully updated to reflect the real project state (version bump + date).
2. [ ] Affected reference docs updated: `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/ENVIRONMENT.md`, `docs/PRODUCT_*.md`, `worklog.md`.
3. [ ] Git state recorded: branch, commit SHA(s), working-tree status, remote name(s) + verified remote SHA.
4. [ ] `git status` reviewed before commit — no essential file left untracked/unstaged; nothing essential only in temp locations.
5. [ ] Commit with a descriptive message.
6. [ ] Push to every configured remote (`backup` today; `origin` once owner provides it) and **prove parity** with `git ls-remote <remote>` vs `git rev-parse HEAD`.
7. [ ] Record evidence (SHAs, verification output) in `worklog.md` entry for the step.
8. [ ] Any information that cannot live in the repo → §8 Honesty Ledger with cause + recovery method. Never claim full recoverability falsely.

**Acceptance criterion:** if this sandbox is destroyed right now, cloning the remote (once it exists) + reading this repository must restore exact project state and allow continuing from the last approved point without any lost progress.
