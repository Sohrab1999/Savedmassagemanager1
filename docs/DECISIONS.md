# Decision Log — Personal Knowledge Manager

**Rule:** No product or technical decision is valid unless recorded here. Decisions made only in chat do not count. Statuses: `PENDING` (awaiting owner) · `APPROVED` (owner confirmed) · `ADOPTED` (process/environment decision made by agent within delegated authority).

---

## A. Pending Product Decisions (D1–D12) — Status: PENDING OWNER APPROVAL

Full context and options in `docs/PRODUCT_AUDIT_REPORT.md` §8.

| ID | Decision | Options | Audit Recommendation | Status | Owner Decision |
|----|----------|---------|---------------------|--------|----------------|
| D1 | Collection membership model | (a) multi-collection (as Brief §6) · (b) single collection + tags | (a) multi; fix singular verbs in Brief §7-D / Flow 2 | **PENDING** | — |
| D2 | MVP UI language(s) | fa only · en only · fa+en | fa+en, RTL-first, i18n from day one | **PENDING** | — |
| D3 | Link metadata fetch in P0 | yes / no | yes (OpenGraph, no AI, SSRF-safe) | **PENDING** | — |
| D4 | Capture interaction | single-field type-infer + override · per-type tabs | single-field infer | **PENDING** | — |
| D5 | Home screen MVP | minimal overview · redirect to All Items | minimal overview | **PENDING** | — |
| D6 | Duplicate URL behavior | allow silently · warn · block | allow + subtle "already saved" indicator | **PENDING** | — |
| D7 | Note format MVP | plain text · markdown-lite · rich text | plain text | **PENDING** | — |
| D8 | File policy | size/quota/types | proposal: 25 MB/file, ~2 GB/user, images+PDF+docs (final pending AD3) | **PENDING** | — |
| D9 | Trash retention | 7/30/90 days · manual only | 30-day auto-purge + manual Empty Trash | **PENDING** | — |
| D10 | Export format | JSON · HTML bookmarks · ZIP files | JSON + ZIP (+ HTML bonus) | **PENDING** | — |
| D11 | Beachhead segment | Persian/Telegram-heavy students+professionals · broad general | Persian-first general, students/professionals as design lens | **PENDING** | — |
| D12 | Item→file cardinality | one file per item · multi-attachment | one file per item for MVP | **PENDING** | — |

**Gate:** No development, design, or technology selection begins until D1–D12 are resolved by the owner.

---

## B. Adopted Process & Environment Decisions (agent authority, recorded for traceability)

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| E1 | 2026-11-04 | UI Pro skill installed via adapted path (`uipro-cli@2.2.3` has no `--global`/`universal` flags; installed with `--ai codex` into temp dir, copied to `~/.agents/skills/ui-ux-pro-max`) | Exact requested command fails in CLI v2.2.3; adaptation achieves owner's global-install goal without touching project |
| E2 | 2026-11-04 | Impeccable v4.8.0 installed globally (`npx skills add pbakaus/impeccable -g -y`); CLI hung on rate-limited api.github.com after download but files fully installed; functional tests passed | Sandbox network limitation documented in `docs/ENVIRONMENT.md` |
| E3 | 2026-11-04 | Persistence Protocol established (see `docs/SNAPSHOT.md` §Protocol) after owner's mandatory requirement: every step ends with updated SNAPSHOT.md + docs + commit + push + verifiable SHA parity | Owner requirement; standing rule for all future steps |
| E4 | 2026-11-04 | No Git remote configured in sandbox (no credentials, no gh CLI, no SSH keys). Best-available recovery: local commits + bare mirror repository at `/home/z/my-project-backup.git` added as git remote `backup`. **True off-sandbox remote requires owner-provided URL + credentials.** | Requirement #8: document limitations explicitly; never claim full recovery falsely |
| E5 | 2026-11-04 | `.env` (contains only `DATABASE_URL`) and `db/custom.db` (scaffold SQLite) are tracked in git from the initial scaffold. Noted as hygiene items: before any public remote is added, `.env` must be untracked + rotated and `db/*.db` untracked. | Security hygiene; no secrets beyond local DB path exist today |

---

## C. Architecture Decisions Register (AD1–AD12) — Status: OPEN (Phase 2 inputs)

Defined in `docs/PRODUCT_AUDIT_REPORT.md` §6. None resolved yet — intentionally. They must not be chosen before product decisions D1–D12 and will be resolved in the Technical Architecture document.
