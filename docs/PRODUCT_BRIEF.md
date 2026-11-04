# PRODUCT BRIEF — Personal Knowledge Manager

**Version:** 1.2 — Approved Product Foundation
**Status:** Approved (D1–D12 confirmed 2026-11-04; final rulings D14–D16 + five binding instructions confirmed 2026-11-04). Phase 0 authorized by owner within a scoped mandate; entry checklist presented for owner review (`docs/PHASE0_CHECKLIST.md`) — design work starts only after checklist approval.
**Supersedes:** v1.1 (deltas in `docs/CHANGELOG.md`); v1.0 archived verbatim at `docs/PRODUCT_BRIEF_v1.0.md`
**Decision basis:** Owner decisions D1–D12 + final rulings D14–D16 + five binding instructions (2026-11-04) + Product Audit (`docs/PRODUCT_AUDIT_REPORT.md`)
**Document language policy:** v1.1 is written in English as the project working language; the original Persian vision text is preserved verbatim. This is an explicit, documented choice (not silent).

---

# 1. Product Vision

ساخت یک فضای شخصی، یکپارچه و هوشمند برای جمع‌آوری، سازمان‌دهی، جست‌وجو و استفاده مجدد از اطلاعات ارزشمند کاربران.

کاربر بتواند هر محتوایی را از هر منبعی ذخیره کند، بدون اینکه مجبور باشد همان لحظه برای سازمان‌دهی آن تصمیم بگیرد.

**Core Philosophy: Capture First, Organize Later.**

اصل بنیادی محصول این است که ذخیره‌سازی باید سریع و سازمان‌دهی باید انعطاف‌پذیر باشد.

**Honest MVP positioning (v1.2):** The word «هوشمند» describes the product's *direction* (P1/P2 intelligence features), not its first release. The MVP deliberately delivers the foundation: fast manual capture, a structured personal library, fast retrieval, flexible organization, and full user ownership. Multi-channel ingestion begins in P1.

# 2. Problem Statement

کاربران روزانه با حجم زیادی از اطلاعات مواجه هستند: پیام‌ها و مطالب تلگرام، مقالات و صفحات وب، تصاویر و اسکرین‌شات‌ها، ویدئوها و فایل‌های آموزشی، ایده‌ها و یادداشت‌های شخصی، مطالب شبکه‌های اجتماعی، منابع کاری و پژوهشی.

این اطلاعات معمولاً در پلتفرم‌های مختلف پراکنده می‌شوند.

مشکلات اصلی:
1. پراکندگی اطلاعات در چندین اپلیکیشن.
2. دشواری پیدا کردن مطالب قدیمی.
3. انباشته شدن محتوای ذخیره‌شده بدون ساختار.
4. فراموش شدن مطالب ارزشمند.
5. دشواری مدیریت حجم زیادی از لینک‌ها، فایل‌ها و یادداشت‌ها.
6. نبود ارتباط مؤثر میان اطلاعات ذخیره‌شده.

محصول باید این مشکلات را با یک کتابخانه شخصی یکپارچه حل کند.

# 3. Target Audience (v1.1 — per D11)

**Primary audience:** Persian-speaking general users. **Persian is the default MVP UI language; English is fully available** (D2). RTL/LTR and internationalization are first-class from day one.

**Design lens:** Students & Learners and Professionals are the initial design lens for prioritizing details (file types, previews, terminology). Content Creators and Everyday Users remain in-scope personas.

**Explicit boundary:** The product is **not restricted to Telegram users** (D11). Telegram-heavy users are a strategic early wedge for P1 ingestion features, not a definitional limit. The four persona groups are directional, not access or feature restrictions.

# 4. Value Proposition

محصول باید پنج ارزش اصلی ارائه کند:

1. **Capture:** ذخیره سریع هر نوع محتوا.
2. **Organize:** سازمان‌دهی انعطاف‌پذیر اطلاعات.
3. **Retrieve:** پیدا کردن سریع محتوای موردنیاز.
4. **Manage:** مدیریت و نگهداری کتابخانه شخصی.
5. **Reuse:** استفاده مجدد از اطلاعات ذخیره‌شده.

### Product Differentiation

محصول نباید صرفاً نسخه دیگری از Notion یا Google Keep باشد. تمرکز آن بر مدیریت محتوای ورودی و اطلاعات پراکنده است، نه ساخت صفحات پیچیده، مدیریت پروژه یا مستندسازی سازمانی.

تفاوت اصلی: سرعت ذخیره‌سازی بیشتر · نیاز کمتر به سازمان‌دهی دستی · پشتیبانی از انواع مختلف محتوا · تجربه متمرکز بر بازیابی اطلاعات · ساختار ساده‌تر از ابزارهای پیچیده مدیریت دانش.

# 5. Core Product Principles

**1. Frictionless Capture** — ذخیره محتوا باید با حداقل تعداد مراحل انجام شود. *(Operationalized: content-type selection is NEVER a mandatory step — D4, owner clarification 3.)*

**2. Organize Later** — کاربر نباید مجبور باشد هنگام ذخیره‌سازی پوشه و تگ انتخاب کند. *(Operationalized: organizing is always optional and skippable; Inbox is not a queue to be emptied.)*

**3. Search Before Navigation** — جست‌وجو باید یکی از سریع‌ترین مسیرهای دسترسی به اطلاعات باشد. *(Known honest limitation: image/file *contents* are not searchable until P1 OCR; title/description/file-name metadata is.)*

**4. Content-Centric Design** — محتوا مهم‌تر از ساختار پوشه‌ها است.

**5. Progressive Complexity** — امکانات پیشرفته باید به‌تدریج و در صورت نیاز در اختیار کاربر قرار بگیرند.

**6. User Ownership** — اطلاعات متعلق به کاربر است و باید امکان خروجی گرفتن و انتقال آن‌ها وجود داشته باشد. *(Operationalized: export and account deletion with full data erasure are explicit P0 requirements.)*

# 6. Information Architecture v1.2

## Main Navigation (unchanged structure)

1. Home · 2. All Items · 3. Inbox · 4. Collections · 5. Favorites · 6. Trash · 7. Settings

## Final View Definitions (audit C7 resolved; deliverable D)

| View | Definition |
|---|---|
| **Home** | Minimal overview per D5: Quick Capture access + 5–10 most recent items + basic library counts (total items, Inbox count, Collections count, Favorites count — assumption A8). Not a dashboard; no widgets, banners, or analytics surfaces (per §10 UX rules). |
| **All Items** | The complete library: every non-deleted Item of the user, regardless of organization state. Default sort: newest first. Supports search, filters (type/collection/tag), and sorting. Paginated (M3). |
| **Inbox** | A dynamic view of all Items belonging to **zero Collections** (D1-consistent). Items with only Tags remain in Inbox (Tags are cross-cutting labels, not filing). Inbox is an organizational aid, not a to-do queue; no pressure affordances. |
| **Collections** | User-created named groups. An Item **may belong to multiple Collections simultaneously** (D1). Verbs: "Add to collection" / "Remove from collection" (v1.0's "move/assign" semantics retired). |
| **Favorites** | Items flagged `is_favorite`. A quick-access layer, independent of Collections/Tags. |
| **Trash** | Soft-deleted Items (via `deleted_at`). **30-day auto-purge** + manual "Delete permanently" + manual "Empty Trash" + Restore (D9). Purged data is unrecoverable. |
| **Settings** | Profile, language (fa/en), theme, quota usage display, export, account deletion. |

## Canonical Item Ingestion Contract (owner clarification 1)

**All ingestion channels — current (web capture, file upload) and future (Telegram Bot, PWA Share Target, bookmarklet, browser extension) — MUST produce the same canonical Item entity.** No channel may create a separate content system.

Canonical Item core: `user_id` + `content_type` + exactly one primary payload (`content` for notes, `source_url` for links, `file_reference` for image/file) + optional `title` and `description`. Channel-specific enrichment (e.g., Telegram metadata) may populate optional fields only; it may not extend the entity.

## Organization Model (D1)

- Items: many-to-many with Collections (`ItemCollection`) and Tags (`ItemTag`).
- Collection and Tag names are unique per user (case-normalized — assumption A4); renaming preserves all associations.
- Nesting of Collections is out of scope (flat structure).

# 7. MVP Scope v1.2 (deliverable C — full P0/P1/P2 boundaries)

## P0 — Essential Features

### A. Authentication & Accounts
- Register, login, logout, session management
- **Password reset** (M1)
- **Email verification — soft nudge, non-blocking (D14):** users may start using the full application without mandatory email verification. **Verified email is required for sensitive operations (data export)**. **Account deletion additionally requires appropriate identity re-authentication** (mechanism deferred to AD4, Phase 2)
- **Account deletion with full data erasure** (M2, owner clarification 5)
- Independent per-user personal space; strict data isolation (DoD)

### B. Quick Capture (D4, owner clarifications 3)
- **Single-field capture** with automatic content-type inference and manual override:
  - Text input → `note` (plain text only, D7)
  - URL input → `link`
  - File/image attachment → `image` | `file` (one attachment per Item, D12)
- Paste input supported as part of the single field
- Title and description always optional; no collection/tag selection at save time
- Saved Items land in Inbox (zero collections)
- Duplicate URL: **allowed**, with a subtle non-blocking indicator (D6, A3)

### C. Link Metadata Fetch (D3 — promoted from P1)
- Asynchronous background fetch of title/description/preview image for `link` Items
- **Never blocks the initial save** (owner clarification 2): background processing, timeouts, response-size limits, URL validation, **SSRF protections** (M9)
- Item is fully usable before metadata arrives; `metadata_status` tracks pending/fetched/failed
- No AI involved

### D. Content Library
- Card grid with per-content-type minimal rendering (link: fetched title/favicon/preview when available, raw URL fallback; note: text snippet; image: thumbnail; file: icon/name/size)
- Default newest-first; sort by created/updated; filter by content type
- **Pagination / virtualized list** (M3) — must remain smooth at large volumes (problem statement #5)
- Duplicate indicator visible in library (D6)

### E. Organization
- Collections: create/edit/delete; **multi-membership** add/remove (D1)
- Tags: create/rename/delete; multiple Tags per Item; renames preserve associations; unique per user
- Unified Item detail surface hosting all organize actions (collection, tags, favorite, trash) — single place, low cognitive load

### F. Search & Filtering
- Fields: title, note text, URL, **description, file name** (M8)
- Filters: content type, Collection, Tag; result sorting
- **Persian text normalization** (ی/ي، ک/ك، ZWNJ) required for correct fa search (M8; implementation = AD2)

### G. Content Management
- View, edit, favorite
- Trash → Restore / permanent delete / Empty Trash; **30-day auto-purge** (D9)
- Permanent deletion requires explicit confirmation

### H. Export (D10, M6 — DoD requirement)
- **JSON export** (complete structured data: items, collections, tags, associations)
- **ZIP archive** containing original files
- **HTML bookmark export — conditional (A1, revised by owner instruction 2):** included only if its implementation cost and scope are validated; **not a mandatory MVP acceptance criterion** unless validated
- **Export requires a verified email (D14)** — sensitive operation

### I. Trust Baseline
- Privacy Policy + Terms pages (M7)
- Persian + English UI (D2), RTL/LTR, Light/Dark mode *(dark-mode MVP scope = pending one-line confirmation **D17** — owner instruction 3; nothing silently kept or removed)*
- Responsive mobile-first + desktop; Loading (skeletons), Empty, Error, Success states; confirmation dialogs; accessibility (v1.0 §7-G unchanged)

### File & Quota Policy (D8)
- Max **25 MB per file**; per-user quota **500 MB** (configurable server-side)
- Target types: images (JPEG/PNG/WebP/GIF), PDF, common documents — final MIME whitelist finalized in the Phase 2 security review (documented, not silently extended)
- Enforcement (D16): when the quota is reached, **additional file uploads are blocked** with clear messaging; **notes and links remain fully savable**
- Quota usage visible in Settings

## P1 — Post-MVP (strategically ordered per audit C4)

1. **PWA installability + Web Share Target** (cheapest real-capture bridge)
2. **Bookmarklet**
3. **Telegram Bot ingestion** (via Canonical Item contract; files re-hosted)
4. **Telegram Mini App**
5. Browser extension
6. OCR for images (enables image content search)
7. Auto tag suggestions
8. Semantic search
9. AI summarization
10. Reading reminders
11. Related items

*(v1.0 P1 items "استخراج خودکار اطلاعات لینک‌ها" and "تشخیص خودکار نوع محتوا" are absorbed into P0 modules C and B respectively — no longer deferred.)*

## P2 — Advanced Product (unchanged)

ارتباط هوشمند میان اطلاعات · Knowledge Graph · استخراج مفاهیم و موضوعات مشترک · دستیار هوشمند کتابخانه شخصی · جست‌وجوی مکالمه‌ای · تبدیل اطلاعات به مجموعه‌های دانشی · اپلیکیشن موبایل مستقل

## Explicitly Out of MVP Scope (v1.1 — expanded per owner clarification 6)

شبکه اجتماعی · اشتراک‌گذاری عمومی کتابخانه · همکاری گروهی · مدیریت پروژه · سیستم یادداشت‌برداری پیچیده و چندصفحه‌ای · دستیار هوش مصنوعی (در MVP) · اتصال مستقیم به حساب شخصی تلگرام · اپلیکیشن Native موبایل

Plus (new explicit exclusions, from audit "future" list): rich-text/markdown editing · bulk multi-select operations · nested/sub-collections · multi-attachment Items · saved searches · offline mode · keyboard command palette · public third-party API.

# 8. Core User Journeys v1.2 (deliverable E)

**J1 — Capture (primary loop)**
User opens Quick Capture (Home/FAB/toolbar) → single field: pastes a URL *or* types text *or* attaches a file/image (type inferred; manual override available but never required) → optional title/description → Save → success feedback → Item exists in Inbox with zero collections. If URL duplicate exists → subtle "already saved" indicator. If link → metadata fetch queued; Item usable immediately; metadata appears when ready.

**J2 — Retrieve**
User opens Search (primary affordance: top of Library on mobile, command-bar style on desktop) → types query (fa or en) → results with type/collection/tag filters → opens Item. Search success = result click (metric definition §12).

**J3 — Organize (always optional)**
User opens Item detail (or selects from Inbox) → adds Item to one or more Collections → adds/removes Tags → closes. Or skips entirely — Items may live in Inbox forever without penalty.

**J4 — Manage**
Item detail → Edit / Favorite / Trash. Trash view → Restore / Delete permanently / Empty Trash. Auto-purge after 30 days.

**J5 — Browse**
Home (capture + recents + counts) → All Items → paginate, filter, sort → open Item. Collections/Favorites views are filtered lenses of the same library.

**J6 — Export & Departure (User Ownership)**
Settings → Export → (email-verification nudge resolved; **verified email required**, D14) → receives JSON + ZIP (+ HTML bookmarks only if A1 cost/scope validated); data complete and human-readable. Settings → Delete account → **identity re-authentication** (D14) → explicit confirmation → all Items, files, tags, collections, and identity permanently erased.

# 9. Data Model v1.2 (product-level; storage implementation = AD1, deferred to Phase 2)

**User:** id · email (unique) · display_name · created_at *(auth credential fields finalized in AD4)*

**Item:** id · user_id · title (optional) · content (note text; plain text per D7) · **content_type** (`note` | `link` | `image` | `file`; video/audio = `file` distinguished by mime — assumption A2) · source_url (links) · file_reference (0..1, D12) · mime_type · file_size · description (optional) · thumbnail_url · **metadata_status** (`none` | `pending` | `fetched` | `failed`) · is_favorite · created_at · updated_at · deleted_at (soft delete)

**Collection:** id · user_id · name (unique per user) · description · icon · color · created_at · updated_at

**Tag:** id · user_id · name (unique per user) · color · created_at · updated_at

**ItemCollection:** item_id + collection_id (composite key) — enables multi-membership (D1)

**ItemTag:** item_id + tag_id (composite key)

**Duplicate detection (D6 + D15):** on save, normalized-URL lookup; normalization = lowercase scheme/host, strip fragment and trailing slash, **plus removal of known tracking parameters only (`utm_*`, `fbclid`, `gclid`)** — meaningful query parameters that may change the destination or content are preserved; **no aggressive URL rewriting** (D15). No persistent duplicate field — computed at capture time.

# 10. Design Direction

### Desired Experience (unchanged)
Minimal · Modern · Calm · Content-focused · Fast · Low Cognitive Load

### UX Priorities (unchanged from v1.0 §10, now with enforced definitions)
1. دسترسی سریع به Quick Capture.
2. نمایش واضح کتابخانه.
3. جست‌وجو در دسترس و قابل استفاده.
4. حداقل پیچیدگی در مدیریت Collection و Tag.
5. طراحی Mobile-first بدون قربانی کردن تجربه دسکتاپ.
6. استفاده از Progressive Disclosure برای امکانات پیشرفته.

از Dashboardهای شلوغ، بنرهای غیرضروری، کارت‌های بیش‌ازحد بزرگ و ابزارهای متعدد در صفحه اصلی اجتناب شود.

### Visual Direction (unchanged + v1.1 additions)
طراحی حرفه‌ای و متمایز · تایپوگرافی خوانا · سلسله‌مراتب بصری مشخص · فضای سفید کافی · رنگ‌های محدود و هدفمند · آیکون‌های یکپارچه · Light/Dark Mode · RTL و LTR

**v1.1 additions (D2):** Persian-first typography with a high-quality Persian font; RTL as first-class layout (logical properties, mirrored icons where needed); locale-aware dates/numbers (A7); language switcher (fa default / en) in Settings.

# 11. Technical & Non-Functional Requirements (v1.1)

Carried from v1.0 §11: معماری قابل توسعه · جداسازی Frontend و Backend · احراز هویت امن · مالکیت و جداسازی داده کاربران · ذخیره‌سازی امن فایل‌ها · مدیریت خطا و بازیابی مناسب · بهینه‌سازی عملکرد در موبایل · طراحی API برای اتصال Telegram Mini App · امکان توسعه به اپلیکیشن موبایل · قابلیت Export اطلاعات · رعایت اصول حریم خصوصی.

**v1.1 additions (all owner-mandated or audit-approved):**
- **Canonical Item ingestion contract** (§6) — binding for all current and future channels
- **Async link metadata fetching**: background processing, timeouts, response-size limits, URL validation, SSRF protection (D3, M9); save latency independent of metadata
- **i18n/RTL architecture from day one** (D2; implementation = AD9)
- **File constraints enforced server-side**: 25 MB/file, 500 MB/user configurable quota, MIME validation by content inspection (D8, M4)
- **Pagination/virtualization performance** for large libraries (M3)
- **Persian search correctness** incl. Unicode normalization (M8; AD2)
- **Export completeness** (D10) and **account deletion with full erasure** (M2)
- **Soft-delete lifecycle** with 30-day purge jobs (D9; AD6)

انتخاب تکنولوژی نهایی همچنان به مرحله Technical Architecture (Phase 2) موکول می‌شود. **No stack selection is made in this document.**

# 12. MVP Success Metrics v1.2 (C8 resolved)

| Metric | Operational definition (v1.2) |
|---|---|
| **Activation** | % of new accounts saving ≥1 Item within their first session |
| **Engagement** | Items saved per active user per week; distinct return visits to the library |
| **Organization** | **Report-only — never an optimization target** (Capture-First guard): % of Items in ≥1 Collection; Tag/Collection usage counts. No user-facing pressure toward "inbox zero" |
| **Retrieval** | Search success rate = search sessions ending in ≥1 result click ÷ search sessions with a query; median time from search-open to item-open (event-based) |
| **Retention** | D7 / D30 return rate |
| **Capture health (P1+)** | Capture channel mix (manual / share target / bot / extension) — measures the real differentiator |

هدف اولیه، افزایش تعداد قابلیت‌ها نیست؛ هدف این است که کاربران واقعاً از محصول برای ذخیره و بازیابی اطلاعات استفاده کنند.

# 13. Development Roadmap (summary — living version: `docs/ROADMAP.md`)

Phase 0 Product Discovery & UX (in progress) → Phase 1 Visual Design & Prototype → Phase 2 Technical Foundation → Phase 3 MVP Development → Phase 4 Quality & Launch (+ private alpha) → Phase 5 Telegram Integration. Roadmap includes audit deltas (export & account lifecycle in build phases, instrumentation in Phase 2, PWA/bookmarklet atop P1).

# 14. MVP Definition of Done v1.2 (deliverable F — expands v1.0 §15)

MVP is release-ready when:

1. User can register, log in, log out, and **reset a forgotten password**.
2. All four content types (`note`, `link`, `image`, `file`) are capturable via **single-field capture**; type selection is never a mandatory step.
3. Library is browsable with **pagination**, remaining smooth at large item volumes.
4. **Multi-Collection membership** (D1) and multi-Tag assignment work; renames preserve associations.
5. Search covers title, note text, URL, description, file name — with **correct Persian matching** — plus type/collection/tag filters and sorting.
6. Link metadata appears **asynchronously** after save; saving is never blocked by it.
7. SSRF protections on metadata fetching are implemented and verified in security review.
8. Duplicate URLs are **allowed** with a subtle indicator (D6).
9. Trash supports restore, permanent delete, Empty Trash, and **30-day auto-purge** (D9).
10. User data is **strictly isolated** between accounts.
11. Experience is acceptable on mobile and desktop; **Persian (RTL, default) and English (LTR)** both functional; Light/Dark mode works (D2) *(dark-mode MVP scope pending confirmation **D17** — owner instruction 3)*.
12. Loading, empty, and error states are handled; destructive actions are confirmed.
13. **Export produces complete JSON + ZIP of files** — human-readable, ownership-grade (D10); **requires verified email** (D14). HTML bookmarks ship only if A1 cost/scope validation passes — **not an acceptance criterion otherwise** (owner instruction 2).
14. **Account deletion permanently erases** all items, files, tags, collections, and identity (M2), gated by **identity re-authentication** (D14).
15. File constraints enforced: **25 MB/file, 500 MB user quota** (D8).
16. Data persists across sessions and devices.

**Final Product Principle (unchanged):**

Build a place where valuable information never gets lost, forgotten, or buried.

---

# Appendix A — Labeled Assumptions (A1–A8) — explicitly UNRESOLVED until individually reviewed by owner

> **Owner instruction (binding, 2026-11-04): silence is NOT approval.** Each assumption stays explicitly labeled and unresolved until the owner individually reviews it (scheduled as a required Phase 0 work item). No assumption may be treated as accepted by default.

| # | Assumption | Basis |
|---|---|---|
| A1 | HTML bookmark export **conditional**: included only if implementation cost & scope are validated; **not a mandatory MVP acceptance criterion** unless validated | D10 + owner instruction 2 |
| A2 | `content_type` enum = `note · link · image · file`; video/audio are `file` (distinguished by MIME); no separate video type in MVP | D4/D12 |
| A3 | "Subtle duplicate indicator" = non-blocking badge/link on the just-saved Item + small marker on library cards; never a modal interruption | D6 |
| A4 | Collection/Tag names unique per user, case-normalized; renames preserve all associations | D1 hygiene |
| A5 | Quota counts stored file bytes only (notes/links/metadata negligible); usage bar in Settings | D8 |
| A6 | ~~no tracking-param stripping in MVP~~ — **SUPERSEDED by D15 ruling**: normalization = lowercase scheme/host + strip fragment/trailing slash + remove known trackers (`utm_*`, `fbclid`, `gclid`) only; meaningful params preserved | D6 → D15 |
| A7 | fa default with language switcher in Settings; locale-aware dates/numbers | D2 |
| A8 | Home counts = total items, Inbox count, Collections count, Favorites count | D5 |

# Appendix B — Remaining Unresolved Items (deliverable G, updated by D14–D16 rulings)

**Resolved 2026-11-04 (final owner rulings — `docs/DECISIONS.md` §A2):** D14 (soft email verification; verified email for export; identity re-authentication for deletion) · D15 (controlled tracking-param stripping: `utm_*`, `fbclid`, `gclid` only) · D16 (quota blocks uploads only; notes/links stay savable).

**Still unresolved (transparent register — nothing silently decided):**
- **A1–A8 assumptions** — explicitly unresolved until individually reviewed by owner; **silence ≠ approval** (owner instruction 1). Scheduled as a required Phase 0 work item (exit gate).
- **D17 — Dark-mode MVP scope (one-line confirmation requested with the Phase 0 checklist review):** owner instruction 3 keeps dark mode out of mandatory MVP scope *unless explicitly required in the approved brief*. Factual check: the approved brief (v1.1, accepted by owner) lists Light/Dark mode explicitly in §7-I, §10, and DoD #11. To avoid deciding silently in either direction, D17 asks the owner to confirm: **(a) retain Light/Dark in MVP** (current brief text) or **(b) demote dark mode to P1** (brief amended accordingly). Design foundations will use theme-agnostic semantic tokens so either outcome requires no rework.
- **D13 — external git remote** (owner action; environment only; does not block product work).

**Technical decisions (AD1–AD12) — intentionally open, resolved in Phase 2 Technical Architecture Document:** storage model for polymorphic Items, search backend + Persian normalization strategy, file storage & signed URLs + EXIF stripping, auth scheme & session strategy, API style + Telegram initData token-exchange design, soft-delete jobs, tenancy isolation, frontend/PWA architecture, i18n/RTL architecture, email delivery, background jobs, observability. See `docs/PRODUCT_AUDIT_REPORT.md` §6.

**Gate (current):** Phase 0 is **authorized by the owner within a scoped mandate** — UX requirements & journeys · IA validation · persona/use-case validation · design principles & design-system foundations · wireframe planning for the four approved core screens. Entry checklist presented for owner review in `docs/PHASE0_CHECKLIST.md`. **No application code, no stack selection, no production UI, no implementation.**
