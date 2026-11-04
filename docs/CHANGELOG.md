# Change Log — Product Brief

## v1.1 → v1.2 (2026-11-04) — Final rulings D14–D16 + owner binding instructions

**Basis:** Owner message 2026-11-04 — "The v1.1 deliverables and the overall direction are accepted, subject to the following final rulings." **Targeted update only**; no other changes were made (owner instruction 5).

1. **D14 applied (email verification = soft nudge):** §7-A rewritten — non-blocking verification; users may use the app fully without verifying; **verified email required for sensitive operations (data export)**; **account deletion requires identity re-authentication** (mechanism deferred to AD4). Woven into §8-J6 and DoD #13/#14.
2. **D15 applied (controlled URL normalization):** §9 duplicate detection — remove **known tracking parameters only** (`utm_*`, `fbclid`, `gclid`); meaningful query parameters preserved; **no aggressive rewriting**. Assumption **A6 marked SUPERSEDED** (recorded, not deleted).
3. **D16 applied (quota edge behavior):** §7 File & Quota — at quota limit, **file uploads blocked** with clear messaging; **notes and links remain savable**.
4. **Owner instruction 2 applied:** **HTML bookmark export made conditional** on validated implementation cost & scope — §7-H and DoD #13 amended; **not a mandatory MVP acceptance criterion** unless validated (revises A1).
5. **Owner instruction 1 applied:** Appendix A re-titled — assumptions **explicitly UNRESOLVED until individually reviewed**; **silence ≠ approval** (supersedes the v1.1 "silence at kickoff = accepted" convention); explicit assumption review scheduled as a Phase 0 work item and Phase 0 exit-gate criterion.
6. **Owner instruction 3 applied:** dark-mode MVP scope registered as **D17** (one-line owner confirmation) with the factual check recorded — the approved brief lists Light/Dark explicitly in §7-I, §10, DoD #11; markers added at §7-I and DoD #11; §10 Persian vision text left verbatim; nothing silently kept or removed.
7. **Header/status updated:** v1.2; Phase 0 authorized within scoped mandate; entry checklist = `docs/PHASE0_CHECKLIST.md` (presented for owner review — no design work started). Internal section version labels aligned to v1.2.

## v1.0 → v1.1 (2026-11-04) — Decision application release

**Basis:** Owner approval of audit direction + explicit decisions D1–D12 + six mandatory clarifications. No decisions were applied beyond those; new micro-gaps were registered as open decisions (D14–D16) and labeled assumptions (A1–A8), not silently resolved.

### Structural
1. **Document language:** v1.1 written in English (project working language); original Persian vision preserved verbatim — explicit documented choice.
2. **Self-contained:** v1.1 is a complete, internally consistent document (no reliance on the audit for its contents). v1.0 archived at `docs/PRODUCT_BRIEF_v1.0.md`.
3. Added §6 "Canonical Item Ingestion Contract" (owner clarification 1).
4. Added Appendix A (assumptions A1–A8) and Appendix B (unresolved decisions D13–D16 + AD register pointer).

### Decision applications
| # | Change | Decision |
|---|---|---|
| 1 | Multi-collection membership confirmed as the data model; v1.0 §7-D "انتقال محتوا به Collection دیگر" (move) and Flow 2 "Assign Collection" (singular) reworded to **Add to/Remove from collection** — resolved audit contradiction C2 | D1 |
| 2 | Target audience rewritten: Persian-speaking general users, fa **default** + en, RTL/LTR + i18n from day one; explicit "not restricted to Telegram users" boundary | D2, D11 |
| 3 | **Link metadata fetch promoted P1 → P0** as new module C: async, non-blocking, timeouts, size limits, URL validation, SSRF protections; `metadata_status` field added; v1.0 P1 items "استخراج خودکار اطلاعات لینک‌ها" absorbed | D3 |
| 4 | Capture flow rewritten: **single field with type inference + manual override**; v1.0 Flow 1 "Select Content Type" step removed; v1.0 P1 item "تشخیص خودکار نوع محتوا" absorbed; type selection never mandatory (clarification 3); plain-text notes (D7); one file per Item (D12); paste input included | D4, D7, D12 |
| 5 | **Home defined**: minimal overview = Quick Capture + 5–10 recent items + basic counts; not a dashboard | D5 |
| 6 | Duplicate policy defined: **allow** + subtle non-blocking indicator; duplicate-detection normalization specified (minimal, MVP) | D6, A6 |
| 7 | File & quota policy added: **25 MB/file, 500 MB/user configurable**; MIME whitelist finalized in Phase 2 security review | D8 |
| 8 | Trash policy finalized: **30-day auto-purge**, manual permanent delete, Empty Trash, Restore | D9 |
| 9 | Export module (H) added to P0: **JSON + ZIP of files + HTML bookmarks** (HTML = assumption A1 "inexpensive") — resolves DoD/roadmap inconsistency C6 | D10 |
| 10 | Inbox/Home/Trash final definitions table added to §6 — resolves C7 | audit + D5/D9 |

### Audit must-haves folded into P0 (previously missing, audit §3)
11. M1 password reset + email verification (gating = new open decision D14 — not silently decided) · M2 account deletion with full erasure · M3 pagination/virtualization · M4 file constraints · M5 trash lifecycle · M6 export definition · M7 Privacy Policy + Terms pages · M8 search over description + file name + Persian normalization (ی/ي، ک/ك، ZWNJ) · M9 SSRF protections · M10 duplicate policy.

### Metrics (C8 resolved)
12. Organization metric demoted to **report-only** (Capture-First guard); Retrieval operationalized (success = result click; time-to-find = search-open→item-open); Activation = ≥1 item in first session; added P1+ capture-channel-mix.

### Scope boundaries (clarification 6 — "no new features")
13. Out-of-scope list expanded with explicit exclusions: rich-text/markdown, bulk multi-select, nested collections, multi-attachment Items, saved searches, offline mode, command palette, public third-party API.
14. P1 re-ordered strategically (PWA Share Target + bookmarklet first — audit C4); P2 unchanged.

### Data model (§9)
15. Added: `content_type` enum, `mime_type`, `file_size`, `thumbnail_url`, `metadata_status`, unique-per-user names, `updated_at` on Collection/Tag, composite-key join tables for multi-membership, soft-delete retained, file cardinality 0..1.

### Journeys & DoD
16. Journeys rewritten (J1–J6) incl. new **J6 Export & Departure**; async metadata and duplicate indicator woven into J1.
17. **Definition of Done expanded 10 → 16 criteria** (adds password reset, pagination, async metadata, SSRF verification, duplicates, trash policy, fa/en RTL/LTR, export, account deletion, quota enforcement).

### Roadmap
18. Living roadmap moved to `docs/ROADMAP.md` with audit deltas (export + account lifecycle in build phases; instrumentation in Phase 2; private alpha in Phase 4).
