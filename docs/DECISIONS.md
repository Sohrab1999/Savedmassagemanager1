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

## A2. Product Decisions D14–D16 — ✅ APPROVED by owner, 2026-11-04 (final rulings)

Applied to Product Brief v1.2 (`docs/PRODUCT_BRIEF.md`); exact deltas in `docs/CHANGELOG.md` (v1.1 → v1.2).

| ID | Decision | Owner Ruling (verbatim intent) | Status |
|----|----------|-------------------------------|--------|
| D14 | Email verification gating | **Option B approved (soft nudge). Users may start using the application without mandatory email verification. Verified email is required for sensitive operations such as data export. Account deletion must still require appropriate identity re-authentication.** | ✅ APPROVED |
| D15 | URL normalization for duplicate detection | **Controlled option B approved. Remove known tracking parameters only — `utm_*`, `fbclid`, `gclid`. Preserve meaningful query parameters that may change the destination or content. Do not perform aggressive URL rewriting.** | ✅ APPROVED |
| D16 | Quota edge behavior | **Option A approved. When the file quota is reached, block additional file uploads only. Notes and links must remain savable.** | ✅ APPROVED |

**Owner binding instructions accompanying the rulings (2026-11-04) — binding, recorded verbatim in intent:**
1. **Silence ≠ approval for A1–A8** — each assumption stays explicitly labeled and unresolved until individually reviewed (supersedes the earlier "silence at kickoff = accepted" convention). Scheduled as a required Phase 0 work item and Phase 0 exit-gate criterion.
2. **HTML bookmark export remains conditional** on validated implementation cost & scope; not a mandatory MVP acceptance criterion unless validated (revises A1 / DoD #13).
3. **Dark mode outside mandatory MVP scope** unless explicitly required in the approved Product Brief → factual check: the approved brief (v1.1, accepted by owner) lists Light/Dark explicitly (§7-I, §10, DoD #11) → registered as **D17** for a one-line owner confirmation rather than silently kept or removed (see §B).
4. **Preserve all previously approved product boundaries; do not introduce additional features.**
5. **DECISIONS.md and the Product Brief updated only with these rulings**; all remaining assumptions and unresolved decisions recorded transparently.
6. **Phase 0 authorized ONLY within this scope:** UX requirements & core user journeys · information architecture validation · persona & use-case validation · design principles & design-system foundations · wireframe planning for the four approved core screens. No application code, no stack selection, no production UI, no implementation. Entry checklist presented for owner review (`docs/PHASE0_CHECKLIST.md`) before any design work starts.

---

## B. Product Decisions PENDING OWNER (non-blocking for the authorized Phase 0 scope)

| ID | Decision | Options / Question | 💡 Recommendation | Status |
|----|----------|--------------------|-------------------|--------|
| D17 | Dark-mode MVP scope (raised by owner instruction 3) | (a) retain Light/Dark in MVP (current brief text: §7-I, §10, DoD #11) · (b) demote dark mode to P1, light-only MVP | (a) retain — explicitly listed in the approved brief; foundations use theme-agnostic semantic tokens so (b) stays cheap if chosen later | **PENDING** — one-line ruling requested together with the Phase 0 checklist review |
| D19 | Trash retention divergence (proposed at step 44 by `roadmaps/PRODUCT-OPPORTUNITY-ROADMAP.md` §1-3) | D9 approved **30-day** retention, but the shipped product runs **7 days** (`TRASH_RETENTION_MS = 7 * 86_400_000`, `src/lib/domain/types.ts`; all UI copy «۷ روز فرصت بازگردانی» N5/B7 rides on 7) | (a) codify **7-day** as the product standard (amend the Brief) — analytic recommendation: matches tested shipped behavior — · (b) implement **30-day** (one constant + UI copy) | **PENDING** — owner ruling required; nothing changes silently |
| D20 | File upload cap divergence (proposed at step 44 by `roadmaps/PRODUCT-OPPORTUNITY-ROADMAP.md` §1-3) | D8 approved **25 MB** per file, but the shipped cap is **10 MB** (`MAX_UPLOAD_BYTES`, `src/server/storage.ts:14` + `quick-capture.tsx:83`) | (a) codify **10 MB** for now (analytic recommendation until Cloud-Go-Live) · (b) raise to **25 MB** (two constants) | **PENDING** — owner ruling required; nothing changes silently |
| A1–A8 | Labeled assumptions (Brief Appendix A) — **explicit individual review required; silence ≠ approval** (owner instruction 1) | see Brief §Appendix A | — | **UNRESOLVED** (required Phase 0 work item W7; each confirmed / vetoed / amended at Phase 0 exit) |
| D13 | External git remote URL + credentials for off-sandbox disaster recovery | owner provides remote / accept same-fs mirror only | provide remote | ✅ **APPROVED & DONE 2026-11-04** — owner provided `https://github.com/Sohrab1999/Savedmassagemanager1` (public, was empty — nothing overwritten); configured as `origin`; complete history pushed; SHA parity verified. Credential stored outside the repo (`~/.git-credentials`, never committed); rotation recommended — see `docs/ENVIRONMENT.md` §5. **Re-verified 2026-11-04 (independent credential-free channels: anonymous `ls-remote` + fresh anonymous clone → `main = e5898b2…`; "empty" displays diagnosed as API-rate-limit checker artifact). Security closure: chat-exposed PAT removed from local credential store; revocation pending owner action; origin push blocked until owner supplies a new credential** |

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
