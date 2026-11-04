# Development Roadmap — Personal Knowledge Manager

**Baseline:** Product Brief v1.0 §14, adjusted per `docs/PRODUCT_AUDIT_REPORT.md` (audit deltas marked ⟵audit).
**Current phase:** Phase 0 (in progress) — gated on decisions D1–D12.

---

## Phase 0 — Product Discovery & UX Definition (IN PROGRESS)

- [x] تکمیل Product Brief (v1.0 received 2026-11-04)
- [x] Product Audit delivered (validation, strategy, MVP audit, UX/IA, technical considerations) ⟵audit
- [ ] **Owner decisions D1–D12** (GATE — see `docs/DECISIONS.md`)
- [ ] Product Brief v1.1 delta patch (C1–C8 fixes + M1–M10 additions, no vision changes)
- [ ] Primary persona confirmation (D11) + User Journey for 2 core flows (capture→retrieve; organize)
- [ ] Information Architecture finalization: Inbox/Home/Trash definitions (C7)
- [ ] Success metric definitions + minimal event list (C8, AD12)
- [ ] Competitive landscape notes (qualitative — no invented data)
- [ ] UX Requirements + Design System definition (with UI Pro + Impeccable skills)

## Phase 1 — Visual Design & Prototype

- [ ] Page structure design (4 core screens first ⟵audit: Capture, Library, Item Detail, Search)
- [ ] Home (minimal overview per D5)
- [ ] Library / All Items (card grid, pagination)
- [ ] Inbox (definition per C7)
- [ ] Collections
- [ ] Content Details (unified organize surface ⟵audit)
- [ ] Quick Capture (single-field type-infer per D4)
- [ ] Mobile Experience (FAB capture, bottom nav)
- [ ] RTL/LTR + Light/Dark treatment (D2)
- [ ] Clickable prototype test with 3–5 beachhead users ⟵audit

## Phase 2 — Technical Foundation

- [ ] Technical Architecture Document resolving AD1–AD12 (incl. Telegram-readiness checklist ⟵audit)
- [ ] Stack confirmation (sandbox stack: Next.js 16 App Router + TS + Prisma/SQLite + shadcn/ui — confirm or adjust)
- [ ] Database design (PKM schema replacing scaffold User/Post demo)
- [ ] Authentication implementation (incl. M1: password reset, email verification)
- [ ] Account deletion + data erasure (M2)
- [ ] Storage implementation (constraints per M4/D8)
- [ ] API design (versioned; Telegram initData → session token exchange endpoint designed now ⟵audit AD5)
- [ ] Event instrumentation + observability baseline (AD12 ⟵audit)
- [ ] Link metadata fetcher, SSRF-safe (if D3 approved)

## Phase 3 — MVP Development

- [ ] Quick Capture
- [ ] Content Library (+ pagination/virtualization M3 ⟵audit)
- [ ] Collections (membership model per D1)
- [ ] Tags
- [ ] Search & Filtering (+ description + file name; Persian normalization M8 ⟵audit)
- [ ] Content Management (+ trash policy M5 ⟵audit)
- [ ] Export (per D10 — required by DoD #10; added to Phase 3 ⟵audit C6)
- [ ] Responsive UI (mobile-first, sticky footer, states)
- [ ] Legal pages: Privacy Policy + Terms (M7 ⟵audit)

**Internal milestones ⟵audit:** MVP-1 = Capture + Library + Search · MVP-2 = Organize + Management + Export + account lifecycle. DoD applies to MVP-2 exit.

## Phase 4 — Quality & Launch

- [ ] Functional Testing
- [ ] UX Audit (Impeccable critique/audit/polish workflows)
- [ ] Accessibility Audit
- [ ] Performance Audit
- [ ] Security Review (upload validation, SSRF, auth, data isolation)
- [ ] **Private alpha with 5–10 real users** ⟵audit
- [ ] Bug Fixing
- [ ] Production Deployment

## Phase 5 — Telegram Integration

- [ ] Telegram Bot
- [ ] Telegram Authentication (initData validation → token exchange per AD5)
- [ ] Message Ingestion (content_type mapping; re-host files ⟵audit)
- [ ] Telegram Mini App
- [ ] Cross-Platform Synchronization

## P1 fast-follow backlog (strategic order ⟵audit)

1. PWA installability + Web Share Target
2. Bookmarklet
3. Browser Extension; OCR; auto-tag suggestions; semantic search; AI summarization; reading reminders; related items

---

## Standing rule (Persistence Protocol)

Every step in every phase ends with the Persistence Protocol defined in `docs/SNAPSHOT.md` §Protocol: SNAPSHOT.md update → docs update → commit → push → SHA parity verification.
