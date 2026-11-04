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

- `github.com` — reachable (HTTPS 200)
- `api.github.com` — **HTTP 403 (rate-limited)**. Any CLI that calls the GitHub API may hang/retry (observed with `npx skills add`; the files still download before the stall).
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

## 5. Git / Remote State — CRITICAL LIMITATION

- The repository had **no remote** configured at session start (no GitHub/GitLab credentials, no `gh` CLI, no SSH keys, no tokens in env).
- Best-available recovery implemented 2026-11-04: **bare mirror repository** at `/home/z/my-project-backup.git`, added as git remote `backup`.
  - This mirror survives working-tree resets and project-directory loss **but lives on the same sandbox filesystem** — it does NOT survive total sandbox destruction.
- **For true off-sandbox disaster recovery, the owner must provide a remote URL + credentials.** Then:
  ```bash
  git remote add origin <URL>
  git push -u origin main
  git ls-remote origin   # verify SHA parity
  ```
- Until then, the acceptance criterion ("sandbox destroyed → clone remote") is **partially met, not fully met**. This is recorded honestly in `docs/SNAPSHOT.md`.

## 6. Git Hygiene Notes (pre-existing scaffold state, do not silently change)

- `.env` is tracked (contains only `DATABASE_URL` pointing at the local SQLite file). Before adding any public remote: `git rm --cached .env`, add to `.gitignore`, rotate value.
- `db/custom.db` (scaffold SQLite binary) is tracked. Before public remote: untrack (`git rm --cached db/custom.db`) and gitignore `*.db`.
- `.gitignore` ignores: `node_modules`, `.next`, `*.log`, `dev.log`, `.env*` (new files), `/skills/` is NOT ignored (tracked intentionally), `local-*`, `test`, `prompt`.

## 7. Key File Paths

| Path | Role |
|---|---|
| `src/app/page.tsx` | The only user-visible route (scaffold demo until development starts) |
| `src/app/api/route.ts` | Scaffold demo API route |
| `prisma/schema.prisma` | Scaffold demo models (User/Post) — to be replaced by PKM schema in Phase 2 |
| `db/custom.db` | SQLite runtime DB (gitignored per hygiene note; currently tracked) |
| `docs/SNAPSHOT.md` | Master recovery snapshot (update every step) |
| `docs/PRODUCT_BRIEF.md` | Verbatim Brief v1.0 |
| `docs/PRODUCT_AUDIT_REPORT.md` | Full audit (C1–C8, M1–M10, AD1–AD12, D1–D12) |
| `docs/DECISIONS.md` | Decision log (single source of decision truth) |
| `docs/ROADMAP.md` | Phase plan with audit deltas |
| `worklog.md` | Chronological work log (update every step) |
