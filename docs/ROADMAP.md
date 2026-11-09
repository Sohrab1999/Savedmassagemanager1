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

## Cloud-Go-Live backlog (blocked on the real Firebase project — QE7, registered 2026-11-05)

Items that can only be executed once the owner activates the corresponding provider/feature in the real Firebase console (this sandbox has emulator-only config):

- [ ] **Password-reset link on the auth gate** (blocker: Firebase **Email provider** must be enabled in the real project, and its SMTP/template configured) — source: `roadmaps/FEATURE-LIBRARY-UPGRADE-ROADMAP.md` §5 Phase 1 QE7. Until then the auth gate intentionally offers no reset affordance; demo mode is unaffected.

## P1 fast-follow backlog (strategic order ⟵audit)

1. PWA installability + Web Share Target
2. Bookmarklet
3. Browser Extension; OCR; auto-tag suggestions; semantic search; AI summarization; reading reminders; related items

## Product strategy wave — "Next Value" (registered 2026-11-07; N1+N2 step 28; N3+N4+N5 step 29; N6+N7+N8 step 30; N10 step 31)

The senior Product-Strategist analysis (mandated by the owner) produced a second standard checkbox roadmap: **`roadmaps/PRODUCT-STRATEGY-ROADMAP.md`** (N1–N10 feature cards, 5-bucket categorization, Top-10 priority scoring with the same formula as the first roadmap, Opportunity Map, value-vs-cost table, explicit warnings, and execution phases **6–9** continuing the numbering of `FEATURE-LIBRARY-UPGRADE-ROADMAP.md` phases 1–5). It also formalizes the P1 fast-follow backlog above into candidate items (e.g. N8 PWA). **Standing discipline: no further N-item starts without an explicit owner order**, and the G2 AI decision remains owner-gated (§ "پکیج تصمیم G2"). When an owner order arrives, the authoritative checklist lives in the strategy roadmap.

**Execution status (2026-11-08, step 36):** the owner ordered **N1 + N2** (step 28), **N3 + N4 + N5** (step 29), **N6 + N7 + N8** (step 30), and **N10** (step 31) — all nine COMPLETE (details in the strategy roadmap §7 and `worklog.md`). **Wave 6 CLOSED; wave 7 CLOSED (N4+N5+N10); phase 8 CLOSED (N6+N7+N8). N9 → phase 9 (owner arbitration; implementation before phase 9 is forbidden). Phase 9 (N9 + the G2 ruling + optional insights) awaits explicit owner orders.** **Steps 32–35 (recorded history, reconstructed at step 36):** step 32 = 6th-recycle repair; step 33 = roadmap #3 registered; steps 34+35 = the roadmap-#3 فاز-A execution orders — **فاز A Quick Wins is COMPLETE (UX-A1…A9 ✅)** — semantic type-palette tokens, StatCard affordance, text-card excerpt preview, bidi greeting, metadata tooltips (step 34); stabilized undo toast, unified EmptyState sweep, capture-CTA hierarchy (owner-verbatim banner headline + mobile reorder after the stats row), toolbar icon aria-labels + tooltips (step 35). **Step 36 = the 7th-recycle repair + full reconstruction:** the 7th platform wipe severed ALL post-v31 commit objects, destroyed the backup mirror, deleted the upload route, emptied `.env`, and removed the roadmap + step-34/35 code + 36 evidence pngs; everything was reconstructed 1:1 from the ledger records and re-verified (lint 0; tsc 0 under `src/`; i18n 308/308; `verify-n10.sh` 23/23; live DoD re-measurements; 12 fresh `uxr-*` screenshots). Honest losses recorded in SNAPSHOT §8 (the lost commit SHAs, the 36 pngs incl. all BEFORE-states, the original roadmap prose). Details + provenance in `roadmaps/UIUX-OVERHAUL-ROADMAP.md` (v1.2R) and `worklog.md` steps 32–36. فازهای B/C were PROPOSAL — **Step 37 (v37): the owner ordered UX-B1 + UX-B2 + UX-B3 (one command, sequence B1→B2→B3); UX-B1 EXECUTED (roadmap #3 → v1.3 — the library toolbar re-architected into the three-layer model; new runbook `scripts/verify-uxb1.sh` 56/56 PASS; 5 `b1-*.png` evidence; +5 i18n keys → 313/313). step 38 (v38) executed **UX-B2** (view-first note sheet — read-only view + one explicit edit session; `scripts/verify-uxb2.sh` 31/31 PASS; 4 `b2-*.png`; +3 i18n keys → 316/316). **step 39 (v39) executed UX-B3** (unified ⌘K command palette — one surface for header/library; `scripts/verify-uxb3.sh` 26/26 PASS; 3 `b3-*.png`; +7 i18n keys → 323/323; a real search-integration bug found & fixed). **The step-37 owner order (UX-B1+B2+B3) is COMPLETE; the §Protocol close-out with the `verify-n10.sh` full regression follows; UX-B4–B7 + فاز C remain PROPOSAL awaiting explicit owner orders (UX-B5 also needs D18).** the owner ordered **N1 + N2** (step 28), **N3 + N4 + N5** (step 29), **N6 (related notes, no-AI) + N7 (weekly resurfacing v1) + N8 (installable PWA)** (step 30), and **N10 (capture-time duplicate detection, soft non-blocking warning)** (step 31) — all nine COMPLETE with full DoD verification (details + evidence in the strategy roadmap §7 phases 6–7 + phase 8, and `worklog.md` steps 28–31). **Wave 6 CLOSED; wave 7 CLOSED (N4+N5+N10); phase 8 CLOSED (N6+N7+N8).** With the step-31 order the owner ALSO re-issued the N9 card verbatim, confirming its own arbitration: **N9 → phase 9 (needs infrastructure + `ecc-security-review`; NOT MVP) — implementation before phase 9 is forbidden.** Phase 9 (N9 + the G2 ruling + optional insights) now awaits explicit owner orders.

---

## UI/UX Overhaul roadmap #3 — "اورهال کامل UI و UX" (registered 2026-11-08, step 33; reconstructed v1.2R at step 36)

The owner ordered (in the role of Principal UX Designer / Product Strategist / UI Architect) a full end-to-end UI/UX review with a standard checkbox roadmap persisted in the roadmaps folder. The deliverable is **`roadmaps/UIUX-OVERHAUL-ROADMAP.md` (roadmap #3 — v1.0 step 33 → … → v1.8 step 42 → v1.9 step 43)** — an evidence-grounded audit covering: diagnosis (7 skin-level + 6 structural pain points, 4 broken-flow findings, plus an explicit protection list of 7 strengths that must never regress), UX reframing, visual system, micro-UX states, real mobile-vs-desktop patterns, accessibility/RTL review, and a **3-phase checkbox roadmap: فاز A Quick Wins (UX-A1…A9) · فاز B Structural Redesign (UX-B1…B7) · فاز C Polishing & Delight (UX-C1…C6)** with per-item DoD/impact/complexity. **Steps 34+35 executed the owner's فاز-A orders: ALL NINE items UX-A1…A9 are ✅ (فاز A COMPLETE); steps 37–39 executed UX-B1 ✅ (three-layer library toolbar; 56/56) + UX-B2 ✅ (view-first note sheet; 31/31) + UX-B3 ✅ (⌘K command palette + unified search; 26/26). The step-40 owner order «گام بعدی مجاز: UX-B4/B6/B7 و فاز C (B5 مشروط به حکم D18)» is now FULLY EXECUTED: step 40 — UX-B4 ✅ (bulk-flow redesign; 40/40), step 41 — UX-B6 ✅ (the optional capture→organize bridge; 16/16), step 42 — UX-B7 ✅ (RTL directional-icon audit clean + the archive/trash scent at the touch points; 16/16); **فاز B is COMPLETE except UX-B5, which remains BLOCKED — D18 (demo-first vs account-first) has NO ruling registered in `docs/DECISIONS.md`**. Step 43: **UX-C1 ✅ executed (the AA contrast audit — a live WCAG engine over getComputedStyle in BOTH themes; 3 real fixes: `--primary` light 0.55→0.53 lifting the primary pair to 4.76, the NEW `--destructive-foreground` token replacing bare white on the 6 destructive confirm buttons — dark 2.88→6.74, light 4.86 — and `--chart-2` light 0.78→0.62 lifting the link-type icon to 3.42 ≥ 3:1 non-text; 35/35 runbook; 2 `c1-*.png`; N10 regression 23/23)**. NEXT under the same standing order: UX-C2 (typography scale) → C3 (motion) → C4 (skeletons) → C5 (micro-tour) → C6 (PWA hook). The step-40 session ALSO unblocked `origin` pushes (owner supplied a fresh PAT; 65 accumulated commits pushed with SHA parity proven; credential NOT stored — rotation recommended). Prioritization between these UX phases and roadmap #2's phase 9 (N9/G2/insights) belongs to the owner.

---

## Product opportunity roadmap #4 — «موج ۳ ارزش» (registered 2026-11-09, step 44)

The owner ordered (in the role of Senior Product Strategist / UX Researcher / AI Product Analyst) a comprehensive product review — current-state maturity, UX weaknesses, feature gaps, grounded new-feature cards, smart categorization (incl. an explicit "do NOT add" bucket), a Top-10 prioritization, and a Feature Opportunity Map + value-vs-cost table + warnings — persisted as a standard checkbox roadmap in the roadmaps folder. The deliverable is **`roadmaps/PRODUCT-OPPORTUNITY-ROADMAP.md` (roadmap #4 — v1.0)**, evidence-grounded against SNAPSHOT v43 and live code (every gap claim carries a file/line proof: `api/export/route.ts` JSON-only vs D10, `api/tags/[id]/route.ts` DELETE-only = no tag rename, `manifest.ts` without share_target vs Brief P1 #1, `MAX_UPLOAD_BYTES` 10 MB vs D8's 25 MB, `TRASH_RETENTION_MS` 7 days vs D9's 30 days). It registers **F1–F10 feature cards** (F1 Web Share Target · F2 Bookmarklet + `#/capture` deep-link · F3 ZIP export closing D10 · F4 tag rename/merge · F5 URL-in-text conversion suggestion closing A-3.1 · F6 mobile related-notes back navigation closing A-3.3 · F7 library dedupe sweep complementing N10 · F8 multi-collection membership = D1 execution, owner-gated · F9 keyboard shortcut layer on B3 · F10 backup reminder), execution phases **10–12** continuing roadmap #2's numbering, the same priority formula `(PI+UXI)×2−Cost−Risk`, and two NEW pending decision requests **D19 (trash 7d vs 30d) and D20 (upload 10MB vs 25MB)** registered in `docs/DECISIONS.md` §B. **Standing discipline: no F-item starts without an explicit owner order; the in-flight step-40 order (UX-C2…C6), phase 9 (N9/G2/insights), the D18-gated B5 and the frozen P1 Telegram bridge are NOT superseded by this roadmap.**

---

## Standing rule (Persistence Protocol)

Every step in every phase ends with the Persistence Protocol defined in `docs/SNAPSHOT.md` §Protocol: SNAPSHOT.md update → docs update → commit → push → SHA parity verification.
