# Development Roadmap — Personal Knowledge Manager

**Baseline:** Product Brief v1.1 (`docs/PRODUCT_BRIEF.md`), adjusted per `docs/PRODUCT_AUDIT_REPORT.md` (deltas marked ⟵audit).
**Current phase:** Phase 0 — brief approved; **kickoff awaiting owner approval of D14–D16 (+A1–A8)**.
**Last updated:** 2026-11-04 (after D1–D12 approval + Brief v1.1)

---

## Phase 0 — Product Discovery & UX Definition (IN PROGRESS — kickoff gated)

- [x] تکمیل Product Brief (v1.0 received; **v1.1 produced & approved-basis recorded**)
- [x] Product Audit delivered (validation, strategy, MVP audit, UX/IA, technical considerations) ⟵audit
- [x] **Owner decisions D1–D12** (APPROVED 2026-11-04 — see `docs/DECISIONS.md`)
- [x] Product Brief v1.1 (complete, internally consistent; canonical Item contract; final IA definitions; operationalized metrics)
- [x] User Journeys drafted (J1–J6, Brief §8) — user validation deferred to prototype testing (Phase 1)
- [x] Information Architecture finalized (Home/Inbox/All Items/Collections/Favorites/Trash definitions — Brief §6)
- [x] Success metric definitions (Brief §12)
- [ ] **Owner decisions D14–D16 + A1–A8 confirmation** (GATE — Phase 0 kickoff)
- [ ] UX Requirements definition (detailed interaction specs per view)
- [ ] Design System definition (fa-first typography, tokens, RTL rules — with UI Pro + Impeccable skills)
- [ ] Qualitative competitive notes (no invented data)
- [ ] Personas validated against D11 lens (students & professionals)

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
- [ ] Authentication implementation (incl. M1 password reset; verification gating per D14)
- [ ] Account deletion + data erasure (M2)
- [ ] Storage implementation (25 MB/file, 500 MB quota per D8; MIME validation; per-user isolation)
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
- [ ] Export (JSON + ZIP + HTML per D10 — required by DoD; in Phase 3 ⟵audit C6)
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
