# Product Audit Report — Personal Knowledge Manager (Brief v1.0)

**Audit date:** 2026-11-04
**Auditor role:** Senior Product Manager / Product Architect
**Method:** Full review of Brief v1.0 against PKM domain practice. No competitor statistics or market data are invented; all market observations are qualitative. Where the brief is silent, items are labeled as assumptions or recommendations.
**Status:** DELIVERED — awaiting product owner decisions on D1–D12 (see `docs/DECISIONS.md`).

**Legend:** ✅ Verified requirement (explicit in brief) · ⚠️ Assumption (implied, unconfirmed) · 💡 Recommendation (audit judgment)

---

## 1. Overall Assessment

**Verdict: Conditionally approved.** The vision is coherent, the discipline about what *not* to build is genuinely good, and the "Capture First, Organize Later" philosophy is a proven, defensible position in this category. The brief does not need a rewrite — it needs **8 critical issues resolved, ~10 missing operational requirements added, and 3 definitional gaps closed** before Phase 1 design work begins.

### 1.1 Product Validation

| Area | Evaluation |
|---|---|
| **Vision** | ✅ Sound and worth preserving verbatim. One caution: the word "هوشمند" (intelligent) in the vision describes the P1/P2 end-state, not the MVP. Keep it as a north star, but position the MVP honestly as *the foundation*: manual capture, structured library, fast retrieval. |
| **Value proposition** | ✅ The five values (Capture/Organize/Retrieve/Manage/Reuse) are consistent. ⚠️ However, the *differentiation* ("capture from anywhere with less friction") is structurally dependent on P1 ingestion channels (bot, extension, share API). The MVP alone validates library/organize/search — **not** the "capture from anywhere" promise. See Critical Issue C4. |
| **MVP scope** | ✅ Appropriately scoped at the macro level — the Explicitly-Out-of-Scope list (§13) is the strongest part of the brief. ⚠️ It is under-specified *operationally* (account lifecycle, file limits, trash policy) and contains two internal contradictions (C1, C2). With the revisions in §5, it is buildable. |

### 1.2 Product Strategy

**Competitive positioning (qualitative, no invented figures):**
- The brief correctly refuses to fight Notion/Obsidian/Google Keep — those target *structured authoring* and *quick notes*; this product targets *inbound content management*. That positioning is credible.
- The nearest qualitative neighbors are read-it-later/bookmark managers (Raindrop.io class) and auto-organizing visual libraries (MyMind class). Mozilla's discontinuation of Pocket (announced 2025) qualitatively confirmed that demand for *saving* persists, but standalone read-it-later alone is a weak business — which reinforces that this product's bet must be **multi-source capture + retrieval**, not just saving.
- ⚠️ **The real incumbent is not another app — it's the habit of Telegram "Saved Messages."** The product must beat that habit on *retrieval and structure*, not on saving convenience (which Saved Messages wins by default). This makes the P1 Telegram Bot a strategic wedge, not a nice-to-have.

**Differentiation opportunities (💡 recommendations):**
1. **RTL-native, Persian-first experience** — global tools in this category are consistently weak at RTL typography and Persian search. Genuine, hard-to-copy wedge if D2/D11 are approved.
2. **Retrieval-first UX** — speed of *finding*, not cleverness of *organizing*, as the felt quality of the product.
3. **Zero-friction multi-channel capture** (delivered progressively: manual → share target → bot → extension).

**Target audience:** ⚠️ Four personas with no priority is acceptable for positioning but not for scoping — file-type support, card previews, and language all depend on the primary segment. The brief's own signals (Persian vision, Telegram roadmap) point to a natural beachhead: **Persian-speaking students and professionals who are heavy Telegram users.** Needs an explicit decision (D11).

---

## 2. Critical Issues

**C1 — Capture flow contradicts the core philosophy.**
Flow 1 (§8) is: `Quick Add → Select Content Type → Enter Content`. This forces a decision before capture, violating Principles 1–2. Basic type inference needs no AI: pasted URL → link; typed text → note; upload → image/file. 💡 **Fix:** single-field capture with automatic type inference + manual override.

**C2 — Collection membership is self-contradictory.**
§6 says an item can be a member of **multiple** Collections simultaneously. But §7-D says "انتقال محتوا به Collection دیگر" (*move* — singular semantics) and Flow 2 says "Assign Collection" (singular). Two different data models and UIs. 💡 Resolve via **D1**; whichever is chosen, verbs in §7-D and Flow 2 must be rewritten to match.

**C3 — The retrieval promise breaks for non-text content.**
"Search Before Navigation" is Principle 3, but MVP search covers only title / note text / URL. Consequences: (a) saved links without manually typed titles are raw URLs — unsearchable and rendered as empty cards; (b) images and files have zero searchable text until P1 OCR. 💡 **Fix:** pull **basic link metadata fetch** (OpenGraph title/description/favicon/thumbnail — plain HTTP parsing, no AI) from P1 into P0 (D3). Accept the image/file searchability gap until P1, and state it explicitly.

**C4 — Vision/MVP gap on "any content from any source."**
§1 promises "هر محتوایی از هر منبعی", but MVP capture is manual entry into a form. The differentiation-carrying channels (bot, extension, share API) all arrive at P1. Acceptable *if acknowledged*; dangerous if the MVP is evaluated against the vision. 💡 Position MVP as "the library foundation," and prioritize **PWA Web Share Target + bookmarklet** at the top of P1.

**C5 — Account lifecycle is unaddressed (launch blocker).**
§7-A covers register/login/logout but omits: password reset, email verification, **account deletion with full data erasure**. Principle 6 (User Ownership) and §11 (privacy) are contradicted by their absence. → Added to revised P0 (§5).

**C6 — Export is required by DoD but undefined and missing from the roadmap.**
DoD #10 requires export; §14 Phase 3 does not list it; no format specified. 💡 Define minimal export (D10) and add to Phase 3.

**C7 — Three IA concepts are undefined: Home, Inbox, Trash.**
- **Home/Overview** vs **All Items**: purpose undefined; §10 warns against busy dashboards, yet Home invites one.
- **Inbox**: membership rule undefined. The entire "Organize Later" loop depends on this definition.
- **Trash**: no auto-purge policy; no "Empty Trash" action.
💡 Definitions: Inbox = items assigned to zero collections (tagged-only items stay in Inbox — tags are cross-cutting, not filing). Home (MVP) = Quick Capture + 5–10 recent items + library counts. Trash = 30-day auto-purge (D9).

**C8 — Success metrics partially conflict with the product philosophy and are under-defined.**
"درصد محتواهای دسته‌بندی‌شده" (% categorized) as an *organization* metric subtly pressures users toward inbox-zero behavior — the anti-pattern "Organize Later" rejects. "Successful search" and "time to find" are not operationally defined. 💡 Keep the metric but demote to report-only; define success = search session ending in a result click; time-to-find = time from search-open to item-open via events. Activation = ≥1 item saved in first session.

---

## 3. Missing Requirements

### Must-have (launch-blocking, currently absent)

| # | Requirement | Rationale |
|---|---|---|
| M1 | Password reset + email verification | Standard auth hygiene; §7-A incomplete without it |
| M2 | Account deletion + data erasure | User Ownership principle; privacy NFR |
| M3 | Pagination / virtualized list for Library | Problem statement #5 explicitly cites "حجم زیادی"; a card grid that dies at 2,000 items fails the core promise |
| M4 | File constraints: allowed MIME types, max size, per-user quota, upload progress + failure recovery | §11 requires "ذخیره‌سازی امن فایل‌ها" with zero operational definition |
| M5 | Trash retention policy + Empty Trash action | Soft-delete exists in the model; the lifecycle doesn't |
| M6 | Export format & scope definition | DoD #10 is unimplementable as written |
| M7 | Privacy Policy + Terms pages | Public signups = legal baseline |
| M8 | Expanded search fields: description + file name; Persian text normalization (ی/ي، ک/ك، ZWNJ) if Persian content supported | Description is a first-class field but unsearchable; Persian normalization is a correctness requirement |
| M9 | SSRF protections for server-side link fetching | If D3 approved, fetching arbitrary user-supplied URLs server-side is a server-exploit vector |
| M10 | Duplicate policy behavior | Saving the same URL twice must have a defined outcome |

### Should-have (MVP if cheap, else P1)

- Clipboard paste capture (paste URL/image into any page → capture)
- Minimal event instrumentation to make §12 metrics measurable (activation, search→click, capture counts)
- Per-type previews: image lightbox, PDF preview/download affordance, favicon/thumbnail on link cards
- Tag/collection rename preserving associations; uniqueness per user
- Guided empty states (double as first-run onboarding)
- Session management (remember-me, multi-device sessions)

### Explicitly future (do not pull in)

Bulk multi-select operations, saved searches, nested collections, multi-attachment items, rich-text editor, offline mode, keyboard-command palette (P1), version history.

---

## 4. Recommended Changes (minimal deltas — not a rewrite)

The vision, philosophy, IA concepts, and scope boundaries stay as written. Apply these deltas:

1. **§7-D wording:** align collection verbs with D1 outcome; keep tag color (trivial, already in model).
2. **§7 Quick Capture:** replace "Select Content Type" step with type inference + override (C1).
3. **§7-C Add:** pagination; skeleton loading as the Loading State standard.
4. **§7-A Add:** M1, M2.
5. **§7-F Add:** trash auto-purge, Empty Trash (C7).
6. **§8 Flow 1:** single-field capture; Flow 2 note that organizing is always optional/skippable (philosophy guard).
7. **§9 Data model deltas:** add `content_type` enum (propose `note | link | image | file`, video/audio as file subtypes), `mime_type`, `file_size`, `thumbnail_url`, unique constraints on `(user_id, collection.name)` and `(user_id, tag.name)`, `updated_at` on Collection/Tag. Confirm model implies **one file per item** (recommend keeping single-file for MVP; multi-attachment is future).
8. **§12 metrics:** redefine per C8; add "capture channel mix" for P1 (measures the real differentiator).
9. **§14 Phase 2:** add event instrumentation + observability; **Phase 3:** add Export (C6); **Phase 4:** add private alpha with 5–10 real users before public launch.
10. **IA definitions (C7):** Inbox = zero-collection items; Home = capture + recents + counts; Trash = 30-day auto-purge.
11. **UX guardrails:** one unified item-detail surface where all organize actions live (collection, tags, favorite, trash) — prevents the "5 routes to the same item" cognitive-load problem; search affordance is the visual anchor of the Library on desktop, top-slot on mobile; FAB for capture on mobile.

---

## 5. Revised MVP Scope

### P0 — Keep (with modifications)

| Module | Change |
|---|---|
| A. Auth & Accounts | + password reset, email verification, account deletion (M1/M2) |
| B. Quick Capture | Single-field with type inference (C1); + clipboard paste (if approved); title/description stay optional |
| C. Content Library | + pagination/virtualization (M3); per-type minimal cards |
| D. Organization | Collections + Tags per D1 outcome; renames preserve associations |
| E. Search & Filtering | + description + file name (M8); Persian normalization if fa (M8) |
| F. Content Management | + trash policy/Empty Trash (M5); permanent-delete confirmation |
| G. UX Baseline | As written (responsive, states, a11y) — no change |
| **H. Export (new)** | Minimal defined format (D10) — required by DoD |
| **I. Link metadata fetch (pulled from P1)** | OpenGraph title/description/favicon/thumbnail; SSRF-safe (M9); no AI |

### Deferred with re-prioritization (P1 order matters strategically)

1. **PWA installability + Web Share Target** (promotion: cheapest real-capture bridge; C4)
2. **Bookmarklet** (added — lighter than extension, works on all desktop browsers)
3. Telegram Bot → message ingestion
4. Browser extension; OCR; auto-tag suggestions; semantic search; AI summarization; reminders; related items; Telegram Mini App

### Future (P2 unchanged, plus)

Multi-attachment items, nested collections, bulk operations, saved searches, offline mode, native mobile apps.

**MVP internal milestones (💡 suggested):** MVP-1 = Capture + Library + Search; MVP-2 = Organize + Management + Export + account lifecycle completion. DoD applies to MVP-2 exit.

---

## 6. Architectural Decisions Requiring Clarification (Phase 2 inputs — no technology chosen here)

| # | Decision | Why it can't wait | Telegram/Future implication |
|---|---|---|---|
| AD1 | Polymorphic item storage: single table with nullable/JSON fields vs per-type tables | Affects search, integrity, every query | Ingested Telegram messages map into the same item shape |
| AD2 | Search backend: DB full-text vs dedicated index; Persian normalization strategy | Principle 3 depends on it; retrofit is painful | Conversational/semantic search (P2) needs an upgrade path |
| AD3 | File storage: object storage + signed URLs vs server-mediated; direct/presigned uploads; thumbnail pipeline; **EXIF stripping** | Cost + security + M4 | Telegram files must be re-hosted, not hotlinked |
| AD4 | Auth scheme: credentials vs magic-link vs OAuth; session strategy | M1/M2 depend on it; migration later is costly | Model must allow linking a Telegram identity later without schema surgery |
| AD5 | API style + versioning + auth transport (cookies vs bearer) | §11 requires "طراحی API برای اتصال Telegram Mini App" — Mini Apps authenticate via Telegram `initData` validated server-side, then exchanged for a session token; design the exchange endpoint now even if built in Phase 5 | Determines whether Phase 5 is an integration or a rewrite |
| AD6 | Soft-delete retention & storage reclamation jobs | M5 | Storage cost control |
| AD7 | Tenancy/isolation model (per-user storage paths, DB scoping) | DoD #7 | — |
| AD8 | Frontend architecture + PWA strategy (installable? share target?) | Determines capture-channel ceiling (C4) | Mini App reuses design tokens but not the web shell |
| AD9 | i18n/RTL architecture: language scope (D2), logical CSS properties, Persian font strategy, locale-aware dates/collation | RTL retrofits are notoriously expensive | — |
| AD10 | Email delivery (verification/reset) | M1 | — |
| AD11 | Background job infrastructure (metadata fetch, thumbnails, purges) | I-module needs it | Bot ingestion will need queues too |
| AD12 | Observability: error tracking + the §12 event schema | Metrics must be buildable from day one | — |

Also noted, not blocking: rate limiting on auth and uploads; upload MIME validation by content sniffing (not extension); CSP/security headers; backup/DR posture; timezone/locale handling.

---

## 7. Prioritized Next Steps

1. **Resolve the decision list in §8** (gates everything).
2. Update the brief to **v1.1 as a delta patch** (C1–C8 fixes + M1–M10 additions) — no vision changes.
3. **Complete Phase 0:** confirm primary persona (D11), write the two core user journeys (capture→retrieve; organize), finalize IA definitions (Inbox/Home/Trash), finalize metric definitions + event list.
4. **Technical architecture document** resolving AD1–AD12 with a Telegram-readiness checklist — Phase 2 entry criteria.
5. **Phase 1 kickoff:** wireframes of 4 core screens (Capture, Library, Item Detail, Search) + clickable prototype test with 3–5 users matching the beachhead persona.
6. Only then: development.

---

## 8. Unresolved Product Decisions Requiring Owner Approval

| # | Decision | Options | 💡 Audit Recommendation |
|---|---|---|---|
| D1 | Collection membership | (a) Multi-collection (as §6) · (b) Single collection + tags (simpler) | **(a)** keep as briefed; fix the singular verbs in §7-D/Flow 2 |
| D2 | MVP UI language(s) | fa only · en only · fa+en | **fa + en** with RTL-first design; i18n architecture from day one (AD9) |
| D3 | Pull basic link metadata fetch into P0 | yes / no | **Yes** — no AI involved; without it links are unsearchable raw URLs (C3) |
| D4 | Capture interaction | single-field infer + override vs per-type tabs | **Single-field infer** (C1) |
| D5 | Home screen MVP | minimal overview (capture + recents + counts) vs redirect straight to All Items | **Minimal overview**; revisit after real usage data |
| D6 | Duplicate URL behavior | allow silently · warn on save · block | **Allow + subtle "already saved" indicator** |
| D7 | Note format MVP | plain text · markdown-lite · rich text | **Plain text** (rich text is scope creep; markdown can come later) |
| D8 | File policy | max file size / per-user quota / allowed types | **Proposal:** 25 MB/file, ~2 GB/user, images + PDF + common docs; final numbers depend on AD3 |
| D9 | Trash retention | 7 / 30 / 90 days, manual only | **30 days auto-purge** + manual Empty Trash |
| D10 | Export format | JSON manifest · HTML bookmarks file · ZIP with original files | **JSON + ZIP of files**; HTML bookmark file as cheap bonus |
| D11 | Beachhead segment | Persian-speaking Telegram-heavy students/professionals vs broad general | **Persian-first general with students/professionals as design lens** |
| D12 | Item→file cardinality | one file per item (as model implies) vs multi-attachment | **One file per item for MVP**; multi-attachment = future |
