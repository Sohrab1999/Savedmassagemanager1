# Decision Log — Personal Knowledge Manager

**Rule:** No product or technical decision is valid unless recorded here. Decisions made only in chat do not count. Statuses: `PENDING` (awaiting owner) · `APPROVED` (owner confirmed) · `ADOPTED` (process/environment decision made by agent within delegated authority).

---

## A. Product Decisions D1–D12 — ✅ APPROVED by owner, 2026-11-04

Applied to Product Brief v1.1 (`docs/PRODUCT_BRIEF.md`); change details in `docs/CHANGELOG.md`.

| ID | Decision | Owner Ruling (verbatim intent) | Status |
|----|----------|-------------------------------|--------|
| D1 | Collection membership | **Multi-collection membership** | ✅ APPROVED |
| D2 | MVP languages | **Persian + English. Persian is the default MVP language. RTL/LTR and i18n from day one.** | ✅ APPROVED |
| D3 | Link metadata in P0 | **Include basic link metadata fetching in P0. Must run asynchronously with SSRF protections.** | ✅ APPROVED |
| D4 | Capture interaction | **Single-field capture, automatic content-type inference, manual override. Text/URL input + file/image attachments.** | ✅ APPROVED |
| D5 | Home screen | **Minimal Home: Quick Capture, recent items, basic library counts.** | ✅ APPROVED |
| D6 | Duplicates | **Allow duplicate URLs with a subtle duplicate indicator.** | ✅ APPROVED |
| D7 | Note format | **Plain-text notes.** | ✅ APPROVED |
| D8 | File policy | **25 MB max per file; initial configurable user quota 500 MB.** | ✅ APPROVED |
| D9 | Trash retention | **30-day retention with manual permanent deletion.** | ✅ APPROVED |
| D10 | Export format | **JSON export + ZIP with original files; HTML bookmark export if inexpensive.** (HTML judged inexpensive → included, labeled A1) | ✅ APPROVED |
| D11 | Beachhead audience | **Persian-speaking general audience; students & professionals as initial design lens. Not restricted to Telegram users.** | ✅ APPROVED |
| D12 | Item→file cardinality | **One file per Item in MVP.** | ✅ APPROVED |

**Owner mandatory clarifications (binding, applied to Brief v1.1):**
1. All ingestion channels create the same canonical Item entity — Brief §6 contract.
2. Link metadata fetch never blocks save: background processing, timeouts, response-size limits, URL validation, SSRF protection — Brief §7-C, §11.
3. Content-type selection never mandatory — Brief §5-P1, §7-B.
4. MVP focus: Capture, Library, Search, Organization, basic Content Management — Brief §7.
5. Account deletion with full erasure + basic export remain explicit MVP requirements — Brief §7-A/H.
6. No features beyond approved scope — Brief §7 out-of-scope expansion.

---

## B. Product Decisions PENDING OWNER (block Phase 0 start)

| ID | Decision | Options | 💡 Recommendation | Status |
|----|----------|---------|-------------------|--------|
| D14 | Email verification gating | (a) required before any use · (b) soft nudge, non-blocking · (c) required only before export/deletion | (b) soft nudge | **PENDING** |
| D15 | URL normalization depth for duplicate detection | (a) minimal: lowercase scheme/host, strip fragment + trailing slash · (b) also strip tracking parameters | (a) minimal for MVP | **PENDING** |
| D16 | Quota edge behavior | (a) block uploads only; notes/links unaffected · (b) block all saves at limit | (a) uploads only | **PENDING** |
| A1–A8 | Labeled assumptions (Brief Appendix A) — owner may veto; silence at Phase 0 kickoff = accepted as labeled | see Brief §Appendix A | — | **PENDING** (non-blocking unless vetoed) |
| D13 | External git remote URL + credentials for off-sandbox disaster recovery | owner provides remote / accept same-fs mirror only | provide remote | **PENDING** (owner action; does not block product work) |

---

## C. Adopted Process & Environment Decisions (agent authority, recorded for traceability)

| ID | Date | Decision | Rationale |
|----|------|----------|-----------|
| E1 | 2026-11-04 | UI Pro skill installed via adapted path (CLI v2.2.3 lacks `--global`/`universal`; `--ai codex` in temp dir → copied to `~/.agents/skills/ui-ux-pro-max`) | Exact requested command fails; achieves owner's global-install goal |
| E2 | 2026-11-04 | Impeccable v4.8.0 installed globally; functional tests passed | Sandbox network limitation documented |
| E3 | 2026-11-04 | Persistence Protocol established (SNAPSHOT.md §Protocol) — standing rule every step | Owner requirement |
| E4 | 2026-11-04 | No Git remote in sandbox; bare mirror `/home/z/my-project-backup.git` added as remote `backup`; true recovery needs owner-provided remote | Requirement #8 honesty rule |
| E5 | 2026-11-04 | `.env` (only `DATABASE_URL`) and `db/custom.db` tracked from scaffold — must be untracked/rotated before any public remote | Security hygiene |
| E6 | 2026-11-04 | Brief v1.1 written in English with Persian vision preserved verbatim | Owner communications in English; documented, not silent (Brief header + CHANGELOG) |

---

## D. Architecture Decisions Register (AD1–AD12) — OPEN (Phase 2 inputs)

Unchanged from `docs/PRODUCT_AUDIT_REPORT.md` §6: AD1 polymorphic item storage · AD2 search backend + Persian normalization · AD3 file storage/signed URLs/thumbnails/EXIF · AD4 auth scheme & sessions · AD5 API style + Telegram initData token exchange · AD6 soft-delete & reclamation jobs · AD7 tenancy isolation · AD8 frontend/PWA architecture · AD9 i18n/RTL architecture · AD10 email delivery · AD11 background jobs · AD12 observability & event schema.

**Resolution order:** after Phase 0 approval, AD1–AD12 are resolved in the Technical Architecture Document (Phase 2 entry criteria). No technology is selected before then.
