# ECC Install Record

- **Date**: 2026-11-07 (clone time 17:11 UTC)
- **Source**: https://github.com/affaan-m/ecc — official repository only (per the ECC README "Official sources only" warning)
- **Source commit**: `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b` (2026-11-06 16:21:50 -0500, merge of PR #3650)
- **License**: MIT
- **Install path**: ECC *Manual Adaptation Guide* (`docs/MANUAL-ADAPTATION-GUIDE.md` in the source repo) — the harness running this project (Z.ai Code) has no native ECC target in the upstream Platform Support matrix
- **Selection principle**: smallest useful bundle for this stack (Next.js 16 App Router, TypeScript, React, Tailwind 4 + shadcn/ui, Prisma SQLite + Firestore dual-mode, fa/en RTL i18n): 4 ECC core-workflow skills + 7 stack skills = 11 of 314 upstream skills. This is deliberately NOT a full vendor copy (upstream repo ≈ 111 MB).

## What was installed

`skills/ecc-tdd-workflow`, `skills/ecc-verification-loop`, `skills/ecc-security-review` (includes reference `cloud-infrastructure-security.md`), `skills/ecc-change-impact`, `skills/ecc-typescript-patterns`, `skills/ecc-react-patterns`, `skills/ecc-react-performance`, `skills/ecc-nextjs-turbopack`, `skills/ecc-prisma-patterns`, `skills/ecc-i18n-sync`, `skills/ecc-frontend-a11y`

Adaptation: only the YAML frontmatter `name:` was changed to the `ecc-` prefixed folder name; all body content is byte-identical to the source commit (verified with `diff -r` at install time).

> **Repo-persistence note (honest):** the platform scaffold gitignores the whole skills directory (`.gitignore` line 54, `/skills/`). To make the ECC layer part of the recoverable repository state, the 11 `skills/ecc-*` folders were committed explicitly with `git add -f skills/ecc-*`; the other harness-provided skills in `skills/` remain untracked by platform policy. A fresh clone therefore contains the ECC skills, but not the rest of `skills/`.

## Security review (pre-install)

- File inventory: every installed folder contains `SKILL.md` only (security-review also ships one reference markdown). **No scripts, binaries, hooks, or dotfiles.**
- Pattern sweep (`curl | sh`, `wget | sh`, `eval(`/`exec(`, `base64 -d`, `os.system`/`subprocess`, prompt-injection phrases ("ignore previous instructions" etc.), exfiltration terms, `nc -e`, `/dev/tcp`, reverse shells): **1 hit** → `tdd-workflow/SKILL.md:35`, which *rejects* fetch-and-execute patterns as part of a defensive checklist. Verdict: PASS.
- Full read of `security-review/cloud-infrastructure-security.md`: defensive cloud-security checklist only (IAM, secrets rotation, CI/CD OIDC, WAF, backups).
- Known non-blocking flag: `tdd-workflow/SKILL.md` "Step 0: Detect the Test Runner" references `CLAUDE_PLUGIN_ROOT` / `$HOME/.claude` — upstream agent-config documentation language. This harness does not execute it, and no hooks are installed here.

## Honest capability boundaries

| ECC capability | Status in this project |
| --- | --- |
| Skills (SKILL.md activation) | Installed — 11 skills under `skills/ecc-*` |
| Agents (71 upstream) | Not installed — harness has its own agent system |
| Commands (98 upstream) | Not installed — no slash-command system; intent registry lives in `AGENTS.md` |
| Hooks (enforcement runtime) | Not installable — harness has no hook runtime |
| Rules packs | Not installed — workflow layer lives in `AGENTS.md` instead |
| Memory / continuous learning | Hook-coupled upstream; here = `docs/SNAPSHOT.md` + `worklog.md` protocol |
| AgentShield scanning | Not installed as tooling; a manual sweep was performed at install (documented above) |

## Checksums (sha256, at install)

| File | sha256 |
| --- | --- |
| skills/ecc-change-impact/SKILL.md | a865dfea52109dc4bcf22002ad72dc6fa798e748ab4812c9e84f149b46c97355 |
| skills/ecc-frontend-a11y/SKILL.md | d78badd48714375a4a85a5184e6e5dfc5d499195b60d28c487aabd15f8073a4b |
| skills/ecc-i18n-sync/SKILL.md | 5baf22e0510353fa366dba00da793e7b6d41911fd308157f4978ca6ca3620a78 |
| skills/ecc-nextjs-turbopack/SKILL.md | e9a08173cf799e4dd50b27ad33f2c683db9ba83c90fe54583caaf1f9e504c38e |
| skills/ecc-prisma-patterns/SKILL.md | 6291f3828041b4fe6b715585c692122208535339c9ab635935f3ada5789b0c44 |
| skills/ecc-react-patterns/SKILL.md | 4d321db6a5b225fb0b0cf4825dc5f6e601d1aa44e6638b6884d8b09fccb5629c |
| skills/ecc-react-performance/SKILL.md | 25a78492d922bad574996d05f8397f883d1a40c79cc2167b2febebe04a58c093 |
| skills/ecc-security-review/SKILL.md | 385d5b668ccff6404025c1d02320bd74b4350d1e978dfe6ed6bdd7fdd3f9a4ed |
| skills/ecc-tdd-workflow/SKILL.md | 8e093e5eda8aec16256c87d3368a9709602867d3eae7dc52fbec1ea61e9402f8 |
| skills/ecc-typescript-patterns/SKILL.md | 12e4ceb48c6584b17fdcd0c10a7ca7090fd8a5ec3da493d96d275d2d8b65c008 |
| skills/ecc-verification-loop/SKILL.md | c79fa4a893b7e69bfc6dd1769186016df202b776c8c35e2458faf250e18b21c6 |

## Cleanup & upgrade

- The temporary source clone `.ecc-source/` was deleted after checksums were recorded (workspace hygiene; provenance above is sufficient for recovery).
- Upgrade procedure: see `AGENTS.md` → "Upgrade procedure".
