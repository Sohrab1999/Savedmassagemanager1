# Sandbox Environment Reference — Persistence & Recovery

**Purpose:** Everything an agent needs to rebuild the working environment after sandbox loss. The repository itself does not contain these runtime artifacts; this file documents why and how to restore each one (Persistence Protocol requirement #8).

---

## 1. Runtime & Toolchain

| Component | Detail |
|---|---|
| OS | Linux sandbox, user `z`, home `/home/z` |
| Project root | `/home/z/my-project` |
| Package manager | **Bun** (primary) + npm available |
| Node/TS | TypeScript 5, Next.js 16.1.1, React 19 |
| Python | 3.12.16 (required by UI Pro skill scripts) |
| Git | configured: `user.name=Z User`, `user.email=z@container` |

## 2. Network Constraints (verified 2026-11-04)

- `github.com` — reachable (HTTPS 200); **git push/pull over HTTPS works** (verified 2026-11-04).
- `api.github.com` — **HTTP 403 for anonymous calls** (rate-limited from this IP). **Authenticated calls with a valid token succeed (HTTP 200 — verified 2026-11-04)**. Any CLI that calls the GitHub API anonymously may hang/retry (observed with `npx skills add`; the files still download before the stall).
- **Consequence for status checks (verified 2026-11-04):** API-based repo checkers can misreport a NON-empty repo as "This repository is empty." (the REST API answers `{"message":"Git Repository is empty."}`, HTTP 409, for repos without commits — and a rate-limited 403 is easily misread the same way). **Authoritative checks:** `git ls-remote <url>`, the GitHub web UI, `raw.githubusercontent.com`, or a fresh clone — never an API wrapper.
- npm registry — reachable.

## 3. Project Command Surface

```bash
bun run dev        # Next.js dev server on port 3000, logs tee'd to dev.log
bun run lint       # ESLint
bun run db:push    # push prisma/schema.prisma to SQLite (db/custom.db)
bun run db:generate
```

- **Port policy:** the Next.js app may only use port 3000. Never `bun run build` in this environment.
- **Gateway:** single external port; cross-service requests must use relative URLs with `?XTransformPort=<port>` (see `Caddyfile`).
- **Mini services** (if added later): independent Bun projects under `mini-services/`, own ports, started with `bun run dev` in background, `bun --hot` for reload.
- **z-ai-web-dev-sdk** must be used server-side only (API routes), never in client code.
- Dev log: `/home/z/my-project/dev.log` (gitignored).

## 4. AI Agent Skills (installed OUTSIDE the repository — not clonable)

These live in `~/.agents/skills/` and will be lost with the sandbox. Reinstall commands:

### UI Pro Max (`ui-ux-pro-max`) — design intelligence database
```bash
npm install -g uipro-cli
rm -rf /tmp/uipro-install && mkdir -p /tmp/uipro-install && cd /tmp/uipro-install
uipro init --ai codex            # CLI v2.2.3: no --global flag, no 'universal' type (verified)
mkdir -p ~/.agents/skills
cp -r /tmp/uipro-install/.codex/skills/ui-ux-pro-max ~/.agents/skills/
rm -rf /tmp/uipro-install
# verify: python3 ~/.agents/skills/ui-ux-pro-max/scripts/search.py "dark mode"
```
Note: uses bundled assets (GitHub release download is rate-limited here). Requires `python3`.

### Impeccable (v4.8.0) — design workflow engine
```bash
npx -y skills add pbakaus/impeccable -g -y
# CLI may hang ~180s on api.github.com 403 AFTER downloading; if ~/.agents/skills/impeccable
# exists and is complete (SKILL.md, reference/, agents/, scripts/), the install is usable.
# verify: ~/.agents/skills/impeccable/scripts/impeccable --version   → 4.8.0
```

### Pre-installed platform skills (in-repo, survive clone)
`skills/` at repo root already contains ASR, LLM, TTS, VLM, agent-browser, etc. These are part of the sandbox platform and tracked in git.

## 5. Git / Remote State — EXTERNAL BACKUP ACTIVE & INDEPENDENTLY RE-VERIFIED (D13 resolved + re-verified 2026-11-04)

- **`origin` (permanent external backup):** `https://github.com/Sohrab1999/Savedmassagemanager1` — **public** repository (proven by fully anonymous access), default branch `main`. Configured 2026-11-04 by owner instruction (resolves decision D13). Repo was verified **empty** before the first push (nothing overwritten); full local history pushed. **Independently re-verified 2026-11-04 via credential-free channels:** anonymous `git ls-remote` → `refs/heads/main = e5898b25e2c16c2dd79ee3beb34ec72d8116f7ea`; fresh anonymous clone (11 commits, all docs present, clean `fsck`); repo page and exact commit page HTTP 200; `raw.githubusercontent.com` serves file contents.
- **"This repository is empty." displays are a checker artifact, not repo state** — see §2 (API rate-limit 403 / 409 empty-repo message). Trust only git-tier or web-tier checks.
- **`backup` (secondary):** bare mirror `/home/z/my-project-backup.git` (same filesystem; kept as fast local redundancy).
- **Push policy (Persistence Protocol step 6):** after every step, push `main` to **every** configured remote and prove parity: `git ls-remote origin` and `git ls-remote backup` must both equal `git rev-parse HEAD`. **Current exception (security closure, 2026-11-04): no GitHub credential exists in the sandbox — `origin` pushes are blocked until the owner supplies a new credential; `backup` parity is always provable.**
- **Authentication (no credentials in the repository — and none currently in the sandbox):**
  - No `gh` CLI; git credential helper is `store` → `~/.git-credentials` (**outside the repo, mode 0600**). The previously stored entry was **REMOVED on 2026-11-04 (security closure)**: the chat-shared token is treated as compromised and must be **revoked by the owner**; it was never reused after exposure, and it is **not in the repository, its history, the backup mirror, remote URLs, shell history, or logs** (verified 2026-11-04: working-tree scan incl. hidden/ignored files, pickaxe scan over all refs and the mirror, token-length probe).
  - ⚠️ **`git credential store` writes credentials in PLAINTEXT.** File mode 0600 only shields against other local users — not against disk access, backups, or sandbox snapshots. Prefer **Git Credential Manager on Windows** (OS keychain integration); Linux equivalent: `libsecret`/keychain helpers.
  - **Owner actions:** (1) **revoke the exposed PAT** (GitHub → Settings → Personal access tokens → fine-grained tokens); (2) optionally issue a replacement fine-grained PAT limited to this repository with `Contents: Read/Write` only; (3) load it locally (never in chat, never in the repo):
    ```bash
    printf 'protocol=https\nhost=github.com\nusername=x-access-token\npassword=NEW_TOKEN\n' | git credential approve
    ```
    Until then `git push origin …` fails fast with prompts disabled (`GIT_TERMINAL_PROMPT=0`) — expected behavior, not an outage.
- **Recovery procedure (fresh environment, no sandbox):**
  1. `git clone https://github.com/Sohrab1999/Savedmassagemanager1.git my-project` (public read requires no auth — verified by fresh anonymous clone 2026-11-04).
  2. Restore the push credential via the `git credential approve` command above (owner-provided token).
  3. If a same-filesystem mirror is available: `git remote add backup /home/z/my-project-backup.git`.
  4. Verify parity: `git rev-parse HEAD` == `git ls-remote origin refs/heads/main`.
  5. Continue with `docs/SNAPSHOT.md` §10.
- Acceptance criterion ("sandbox destroyed → clone remote + read docs = full recovery") is **met for the repository up to the last SHA proven on `origin` (`e5898b2…`, which already contains all product documents, complete history, and SNAPSHOT v6)**. Any commit newer than that lives on `backup` only until the owner restores a push credential — tracked in `docs/SNAPSHOT.md` §8/§9. Non-repo artifacts (AI skills, runtime DB, dev server) remain documented in `docs/SNAPSHOT.md` §8.

## 6. Git Hygiene Notes (updated 2026-11-04 — both actions DONE before first external push)

- ✅ **DONE (commit `55c04e3`):** `.env` untracked (`git rm --cached`), `.gitignore` covers it (`.env*` pre-existing). `.env` contains only `DATABASE_URL=file:/home/z/my-project/db/custom.db` (local path, no secret). Recreate after fresh clone:
  ```bash
  printf 'DATABASE_URL=file:/home/z/my-project/db/custom.db\n' > .env
  ```
- ✅ **DONE (same commit):** `db/custom.db` untracked; `.gitignore` now has `/db/` and `*.db`. Recreated by `bun run db:push`.
- **Residual-history fact (documented, no rewrite):** commits before `55c04e3` still contain the old `.env` (benign local path) and the scaffold `db/custom.db` binary in history. Owner constraint: complete history is preserved — no history rewriting. Nothing sensitive is in history (full scan 2026-11-04: no PATs, API keys, private keys, AWS keys).
- `.gitignore` ignores: `node_modules`, `.next`, `*.log`, `dev.log`, `.env*`, `/db/`, `*.db`, `local-*`, `test`, `prompt`.

## 7. Key File Paths

| Path | Role |
|---|---|
| `src/app/page.tsx` | The only user-visible route (scaffold demo until development starts) |
| `src/app/api/route.ts` | Scaffold demo API route |
| `prisma/schema.prisma` | Scaffold demo models (User/Post) — to be replaced by PKM schema in Phase 2 |
| `db/custom.db` | SQLite runtime DB (untracked since 2026-11-04; recreated by `bun run db:push`) |
| `docs/SNAPSHOT.md` | Master recovery snapshot (update every step) |
| `docs/PRODUCT_BRIEF.md` | Product Brief (current: v1.2; v1.0 archived) |
| `docs/PRODUCT_AUDIT_REPORT.md` | Full audit (C1–C8, M1–M10, AD1–AD12, D1–D12) |
| `docs/DECISIONS.md` | Decision log (single source of decision truth) |
| `docs/ROADMAP.md` | Phase plan with audit deltas |
| `worklog.md` | Chronological work log (update every step) |
