# AGENTS.md — ECC Workflow Layer

> **Provenance**: Adapted from [ECC](https://github.com/affaan-m/ecc) (MIT), commit `d2ef2680594f9a17526a6e1a2e18b3d242c5d17b`, installed 2026-11-07 via the ECC *Manual Adaptation Guide* (this harness has no native ECC target in the upstream Platform Support matrix).
> **Honest boundaries**: this harness has **no ECC hook runtime** and **no slash-command system**. ECC skills are discovered from `skills/ecc-*/SKILL.md` via the harness Skill tool. Nothing here pretends hooks or slash commands exist.

## Core lifecycle

```
plan -> test -> implement -> review -> verify -> remember -> improve
```

1. **Plan before build** — for non-trivial work, state scope, blast radius, and acceptance criteria before editing. Use `ecc-change-impact` for cross-module, schema, API-contract, or governance-doc changes.
2. **Test-first where possible** — consult `ecc-tdd-workflow` for features and refactors.
3. **Review the diff** — check against the stack skills below (typescript/react patterns, performance, prisma, a11y, i18n).
4. **Verify before done** — run the gates that exist in this project: `bun run lint`, TypeScript check, dev-server health, plus browser verification for UI changes. See `ecc-verification-loop`.
5. **Security review** — consult `ecc-security-review` when touching auth, user input, secrets, API routes, or sensitive data flows.
6. **Remember** — durable decisions go into `docs/SNAPSHOT.md` and `worklog.md` per the project persistence protocol (never chat-only).
7. **Improve** — when a workflow repeatedly works, distill it into a reusable skill (see `skill-creator` / `task-review`).

## Installed ECC skills

| Skill | Activate when |
| --- | --- |
| `ecc-tdd-workflow` | New feature, bug fix, or refactor that should be test-first |
| `ecc-verification-loop` | Quality gates after a feature/refactor, before declaring done |
| `ecc-security-review` | Auth, user input, secrets, API endpoints, sensitive features |
| `ecc-change-impact` | Cross-module or high-risk changes, schema/API contract changes |
| `ecc-typescript-patterns` | Writing or reviewing TypeScript |
| `ecc-react-patterns` | Writing or reviewing React components |
| `ecc-react-performance` | Performance review of React/Next.js code |
| `ecc-nextjs-turbopack` | Next.js 16 dev/build/HMR/bundler issues |
| `ecc-prisma-patterns` | Prisma schema, queries, transactions, migrations |
| `ecc-i18n-sync` | Adding or syncing fa/en locale dictionary keys |
| `ecc-frontend-a11y` | Forms, modals, keyboard nav, a11y lint findings |

## Command intent registry (this harness has no slash commands)

| Intent (say this) | Meaning |
| --- | --- |
| "plan `<task>`" | Produce a plan and impact analysis before code |
| "verify" | Run the ecc-verification-loop gates available in this project |
| "security review `<path>`" | Apply the ecc-security-review checklist to a path |
| "impact `<change>`" | Apply the ecc-change-impact analysis |

## Upgrade procedure

1. Fresh clone: `git clone --depth 1 https://github.com/affaan-m/ecc.git .ecc-source`
2. Re-run the security sweep documented in `docs/ECC-INSTALL.md`
3. Re-copy the 11 folders with the `ecc-` prefix; set each SKILL.md `name:` frontmatter to the folder name
4. Re-record checksums in `docs/ECC-INSTALL.md`, then commit
