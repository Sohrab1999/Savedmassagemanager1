# Development Roadmap — Personal Knowledge Manager

**Baseline:** Product Brief v1.2 (`docs/PRODUCT_BRIEF.md`), adjusted per `docs/PRODUCT_AUDIT_REPORT.md` (deltas marked ⟵audit).
**Current phase:** Phase 0 — **authorized by owner (scoped)**; design work gated on owner approval of `docs/PHASE0_CHECKLIST.md`.
**Last updated:** 2026-11-04 (after D14–D16 final rulings + scoped Phase 0 authorization)

---

## Phase 0 — Product Discovery & UX Definition (AUTHORIZED — design work gated on checklist approval)

**Owner-authorized scope (2026-11-04):** UX requirements & journeys · IA validation · personas & use-cases · design principles & design-system foundations · wireframe planning for the four approved core screens. Full checklist: `docs/PHASE0_CHECKLIST.md`.

- [x] تکمیل Product Brief (v1.0 received; v1.1 approved-basis; **v1.2 current** — D14–D16 final rulings applied)
- [x] Product Audit delivered (validation, strategy, MVP audit, UX/IA, technical considerations) ⟵audit
- [x] **Owner decisions D1–D12** (APPROVED 2026-11-04 — see `docs/DECISIONS.md` §A)
- [x] **Owner final rulings D14–D16 + five binding instructions** (APPROVED 2026-11-04 — `docs/DECISIONS.md` §A2; A1–A8 explicitly unresolved until review — silence ≠ approval)
- [x] Product Brief v1.2 (complete, internally consistent; canonical Item contract; final IA definitions; operationalized metrics)
- [x] User Journeys drafted (J1–J6, Brief §8) — validation = Phase 0 work item W4
- [x] Information Architecture finalized (Home/Inbox/All Items/Collections/Favorites/Trash definitions — Brief §6) — validation = Phase 0 work item W1
- [x] Success metric definitions (Brief §12)
- [x] **Phase 0 entry checklist prepared & presented** (`docs/PHASE0_CHECKLIST.md` — DRAFT, awaiting owner review — GATE for design work)
- [ ] **Owner approves Phase 0 entry checklist** (+ optional D17 one-liner) — GATE
- [ ] W1 · D0-3 Information architecture validation
- [ ] W2 · D0-4 Personas & use-cases validation (D11 lens)
- [ ] W3 · D0-1 UX Requirements specification (traceable to Brief §7 / decisions / audit M-items)
- [ ] W4 · D0-2 Core user journeys validated (J1–J6 ↔ requirement matrix)
- [ ] W5 · D0-5 Design principles + design-system foundations (fa-first typography criteria, theme-agnostic semantic tokens, RTL rules)
- [ ] W6 · D0-6 Wireframe plan for the four approved core screens (Quick Capture, Library, Item Detail, Search — blueprint only; visuals = Phase 1)
- [ ] W7 · A1–A8 individual assumption review + D17 ruling + Phase 0 exit package (owner)

*Not authorized in Phase 0 scope: qualitative competitive notes (available on request); all stack/architecture work (AD1–AD12, Phase 2).*

## Phase 1 — Visual Design & Prototype

- [ ] Page structure design (4 core screens first ⟵audit: Capture, Library, Item Detail, Search)
- [ ] Home (minimal overview per D5)
- [ ] Library / All Items (card grid, pagination M3, duplicate indicator)
- [ ] Inbox (zero-collection dynamic view)
- [ ] Collections (multi-membership UI per D1)
- [ ] Content Details (unified organize surface ⟵audit)
- [ ] Quick Capture (single-field infer per D4, async metadata states per D3)
- [ ] Mobile Experience (FAB capture, bottom nav)
- [ ] RTL/LTR + Light/Dark treatment (D2)
- [ ] Clickable prototype test with 3–5 beachhead users ⟵audit

## Phase 2 — Technical Foundation

- [ ] Technical Architecture Document resolving AD1–AD12 (incl. Telegram-readiness checklist ⟵audit)
- [ ] Stack confirmation (sandbox stack: Next.js 16 App Router + TS + Prisma/SQLite + shadcn/ui — confirm or adjust)
- [ ] Database design (PKM schema per Brief §9 replacing scaffold User/Post demo)
- [ ] Authentication implementation (incl. M1 password reset; D14: soft verification nudge, verified email for export, re-auth for deletion)
- [ ] Account deletion + data erasure (M2)
- [ ] Storage implementation (25 MB/file, 500 MB quota per D8; D16: uploads blocked at limit, notes/links unaffected; MIME validation; per-user isolation)
- [ ] API design (versioned; Telegram initData → session token exchange endpoint designed now ⟵audit AD5)
- [ ] Async link metadata fetcher, SSRF-safe (D3/M9) + background jobs (AD11)
- [ ] Event instrumentation + observability baseline (AD12 ⟵audit)

## Phase 3 — MVP Development

- [ ] Quick Capture (single-field, inference, override)
- [ ] Content Library (+ pagination/virtualization M3 ⟵audit)
- [ ] Collections (multi-membership per D1)
- [ ] Tags
- [ ] Search & Filtering (+ description + file name; Persian normalization M8 ⟵audit)
- [ ] Content Management (+ 30-day trash policy D9 ⟵audit)
- [ ] Link metadata pipeline (async, non-blocking)
- [ ] Export (JSON + ZIP per D10 — mandatory; HTML bookmarks conditional on A1 cost/scope validation — owner instruction 2; in Phase 3 ⟵audit C6)
- [ ] Responsive UI (mobile-first, sticky footer, states, i18n fa/en RTL/LTR)
- [ ] Legal pages: Privacy Policy + Terms (M7 ⟵audit)

**Internal milestones ⟵audit:** MVP-1 = Capture + Library + Search · MVP-2 = Organize + Management + Export + account lifecycle. DoD (Brief §14, 16 criteria) applies to MVP-2 exit.

## Phase 4 — Quality & Launch

- [ ] Functional Testing
- [ ] UX Audit (Impeccable critique/audit/polish workflows)
- [ ] Accessibility Audit
- [ ] Performance Audit
- [ ] Security Review (upload validation, SSRF, auth, data isolation, MIME whitelist finalization)
- [ ] **Private alpha with 5–10 real users** ⟵audit
- [ ] Bug Fixing
- [ ] Production Deployment

## Phase 5 — Telegram Integration

- [ ] Telegram Bot (ingestion via Canonical Item contract; files re-hosted)
- [ ] Telegram Authentication (initData validation → token exchange per AD5)
- [ ] Message Ingestion (content_type mapping per Brief §9)
- [ ] Telegram Mini App
- [ ] Cross-Platform Synchronization

## P1 fast-follow backlog (strategic order ⟵audit)

1. PWA installability + Web Share Target
2. Bookmarklet
3. Browser Extension; OCR; auto-tag suggestions; semantic search; AI summarization; reading reminders; related items

---

## Standing rule (Persistence Protocol)

Every step in every phase ends with the Persistence Protocol defined in `docs/SNAPSHOT.md` §Protocol: SNAPSHOT.md update → docs update → commit → push → SHA parity verification.
