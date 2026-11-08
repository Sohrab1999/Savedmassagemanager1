# Phase 0 Entry Checklist — Personal Knowledge Manager

> **STATUS: DRAFT — PRESENTED FOR OWNER REVIEW. No design work has started.**
> Design work begins only after the owner approves this checklist (as-is or with amendments).
>
> **Version:** 1.0 (draft for review) · **Date:** 2026-11-04 · **Basis:** Product Brief v1.2 (`docs/PRODUCT_BRIEF.md`) · Owner authorization 2026-11-04 (`docs/DECISIONS.md` §A2, instruction 6)

---

## 1. Entry Gate Status

| Item | State |
|---|---|
| D1–D12 product decisions | ✅ APPROVED 2026-11-04 (`docs/DECISIONS.md` §A) |
| D14–D16 final rulings | ✅ APPROVED 2026-11-04 (`docs/DECISIONS.md` §A2) |
| A1–A8 assumptions | ⏳ Explicitly UNRESOLVED — **silence ≠ approval** (owner instruction 1); scheduled as required work item W7; each individually confirmed / vetoed / amended at Phase 0 exit |
| D17 dark-mode MVP scope | ⏳ One-line ruling requested together with this checklist (non-blocking for checklist approval) |
| D13 external git remote | ⏳ Open — owner action, environment only, non-blocking |
| AD1–AD12 architecture | 🔒 Deliberately OPEN — resolved in Phase 2 only |
| Owner authorization for Phase 0 | ✅ Granted 2026-11-04, strictly within §2 scope |

## 2. Owner-Authorized Scope (the five workstreams, verbatim)

1. UX requirements and core user journeys
2. Information architecture validation
3. Persona and use-case validation
4. Design principles and design-system foundations
5. Wireframe planning for the four approved core screens

**The four approved core screens** (per audit + roadmap: "4 core screens first"): **Quick Capture · Library (All Items) · Item Detail · Search.**
All other surfaces (Home, Inbox, Collections, Favorites, Trash, Settings) are designed in Phase 1.

## 3. Hard Constraints (owner-mandated, binding throughout Phase 0)

- **No application code.** **No technology-stack selection** (AD1–AD12 stay open). **No production UI.** **No implementation.**
- No features beyond approved Brief v1.2 boundaries (owner instruction 4).
- All assumptions A1–A8 remain labeled and unresolved until individually reviewed (owner instruction 1).
- Dark mode is not treated as a design driver pending D17; design-system foundations use **theme-agnostic semantic tokens** so either D17 outcome requires no rework.
- Brief §11 boundary: no technology choice in any Phase 0 deliverable.
- Persistence Protocol after every step (`docs/SNAPSHOT.md` §Protocol).

## 4. Deliverables (D0-1 … D0-6)

### D0-1 — UX Requirements Specification
- Per-surface UX requirements: Home, All Items, Inbox, Collections, Favorites, Trash, Settings, Quick Capture, Search, Item Detail.
- Mandatory states per surface: loading / empty / error / success; destructive-action confirmation patterns.
- Friction guards: capture never blocked; content-type selection never required (D4, clarification 3); async metadata never blocks saving (D3).
- Ruling behavior at UX level: soft verification nudge + verified-email gate on export + re-auth on deletion (D14) · duplicate indicator (D6/D15) · quota-blocked upload vs. savable note/link (D16) · 30-day trash semantics (D9).
- Accessibility requirements; RTL/LTR behavior rules; mobile-first breakpoints.
- **Acceptance criteria:** 100% coverage of Brief §7 P0; every requirement traceable to a Brief § / decision ID / audit M-item; zero orphan or invented requirements; zero contradictions with Brief v1.2.

### D0-2 — Core User Journeys (validated)
- J1–J6 validated against D0-1; journey ↔ requirement traceability matrix.
- Edge cases woven in: duplicate URL indicator (D6/D15) · async metadata states (D3) · quota edge (D16) · verification nudge, export gate, deletion re-auth (D14) · trash lifecycle (D9) · multi-collection membership (D1).
- **Acceptance criteria:** every journey step maps to ≥1 requirement; every P0 requirement is reachable from ≥1 journey.

### D0-3 — Information Architecture (validated)
- Navigation model validation (7 surfaces + capture affordances).
- View-definition edge cases: Inbox = zero collections (tag-only items stay in Inbox); Favorites = independent layer; Trash 30-day semantics + restore/permanent-delete/empty.
- Entity-relationship review vs Brief §9 (product level only — no storage decisions, AD1 stays open).
- Core terminology glossary seed (Item, Collection, Tag, Inbox, Trash, Capture, …) in **fa + en**.
- **Acceptance criteria:** all C7 definitions implementable without ambiguity; glossary covers all core nouns; zero contradictions with Brief v1.2.

### D0-4 — Personas & Use-Cases (validated)
- 4 persona groups validated against the D11 lens: Students & Learners + Professionals as design lens; Content Creators + Everyday Users in scope; not Telegram-restricted.
- Top 3–5 use cases per persona mapped to P0 features; explicit anti-use-cases (what the MVP deliberately does not serve).
- **Acceptance criteria:** every P0 feature justified by ≥1 persona use case; no persona's core loop requires a non-P0 feature.

### D0-5 — Design Principles & Design-System Foundations
- Design principles operationalizing Brief §10 (minimal · modern · calm · content-focused · fast · low cognitive load) with Capture-First guards (no dashboards/banners/pressure affordances).
- Semantic token plan: color, spacing, radius, typography scale, elevation — **theme-agnostic** (light default; dark addable without rework — D17-safe).
- fa-first Persian typography direction: font-selection criteria + ZWNJ / Persian digits / punctuation rules (criteria only; the font asset choice is documented when made).
- RTL layout rules: logical properties, mirroring, icon direction, locale-aware dates/numbers (A7).
- Component inventory mapped to the existing shadcn/ui set (platform-fixed; no new stack).
- **Acceptance criteria:** tokens theme-agnostic; RTL rules testable; **no visual mockups produced** (those are Phase 1).

### D0-6 — Wireframe Plan (the four approved core screens)
- Per screen — **Quick Capture, Library (All Items), Item Detail, Search**: purpose, content inventory, hierarchy, primary/secondary actions, mandatory states, breakpoint behavior (mobile-first), RTL mirroring notes, capture-friction guard placement, traceability to D0-1 requirements.
- **Scope note (owner's word "planning"):** this is the *specification/blueprint* for wireframes. Visual wireframes themselves are produced in Phase 1 against this plan.
- **Acceptance criteria:** all four screens fully specified; zero scope additions; every planned element traceable to a requirement.

## 5. Proposed Execution Order (dependency-aware; owner may re-order)

| # | Work item | Depends on |
|---|---|---|
| W1 | D0-3 Information architecture validation | — |
| W2 | D0-4 Personas & use-cases | — |
| W3 | D0-1 UX requirements | W1, W2 |
| W4 | D0-2 Journey validation | W3 |
| W5 | D0-5 Design principles & foundations | W1 |
| W6 | D0-6 Wireframe plans (4 core screens) | W3, W5 |
| W7 | **A1–A8 individual assumption review + D17 ruling + Phase 0 exit package (owner)** | W1–W6 |

## 6. Explicitly OUT of Phase 0

Visual design & clickable prototype · user testing · any stack/architecture decision (AD1–AD12) · database schema & API design · application code · dark/light theming implementation (pending D17) · wireframe planning for Home/Inbox/Collections/Favorites/Trash/Settings (Phase 1) · anything not listed in §2.

## 7. Exit Gate (Phase 0 → Phase 1)

- [ ] D0-1 … D0-6 complete, internally consistent with Brief v1.2, zero scope additions
- [ ] A1–A8 individually reviewed & ruled by owner (explicit — confirmed / vetoed / amended; no silence)
- [ ] D17 ruled
- [ ] Owner sign-off on the Phase 0 package

→ Phase 1 (Visual Design & Prototype) begins per `docs/ROADMAP.md`.
