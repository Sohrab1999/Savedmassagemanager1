// PURE hash navigation (S3/N4/QE2 + F2) — split out of app-store at step 45
// (owner rule: atomic modules). No store access in here: parsing/serializing
// only. The hash is UNTRUSTED input — malformed values fall back to defaults.
//
// F2 — the capture deep-link (`#/capture?url=…&title=…&text=…`) has PARSE
// PRIORITY: a hash whose path is `capture` is NEVER re-interpreted as a
// library/N4/QE2 route. `#/capture` with no params = the plain empty dialog
// (same dialog as the FAB), per the F2 DoD. N4/QE2 deep-links keep their own
// `#/library?…` paths and remain untouched.

import { NOTE_TYPES, type NoteSort, type NoteType } from "@/lib/domain/types";
import {
  parseCaptureQuery,
  type CapturePrefill,
} from "@/lib/capture/capture-prefill";
import {
  defaultLibraryFilters,
  type AppView,
  type LibraryFiltersState,
} from "@/stores/library-filters";

export interface HashRoute {
  view: AppView;
  filters: LibraryFiltersState;
  /** F2 — non-null only for `#/capture?…`; the caller opens the capture
   * dialog (with prefill or plain) and CONSUMES the hash. */
  capture: CapturePrefill | null;
}

const VALID_VIEWS: AppView[] = ["dashboard", "library", "categories", "settings"];
const VALID_SORTS: NoteSort[] = ["newest", "oldest", "title"];

function viewFromPath(raw: string): AppView {
  return VALID_VIEWS.includes(raw as AppView) ? (raw as AppView) : "dashboard";
}

export function parseHash(hash: string): HashRoute {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");

  // F2 — capture deep-link: exclusive route (parse priority over everything).
  // An all-empty capture (no params) is still a capture route → plain dialog.
  if (path === "capture") {
    const capture = parseCaptureQuery(query);
    return {
      view: "dashboard",
      filters: { ...defaultLibraryFilters },
      capture,
    };
  }

  const view = viewFromPath(path);
  const filters: LibraryFiltersState = { ...defaultLibraryFilters };
  if (view === "library" && query) {
    const params = new URLSearchParams(query);
    const q = params.get("q");
    if (q !== null) filters.q = q;
    const type = params.get("type");
    if (type && (NOTE_TYPES as readonly string[]).includes(type)) {
      filters.type = type as NoteType;
    }
    const cat = params.get("cat");
    if (cat) filters.categoryId = cat; // 'none' or an id ('all' is omitted)
    const tags = params.get("tags");
    if (tags) {
      filters.tagIds = tags.split(",").map((id) => id.trim()).filter(Boolean);
    }
    if (params.get("fav") === "1") filters.favorite = true;
    if (params.get("arch") === "1") filters.archived = true;
    // S5 — trash deep-link; mutual exclusion with archived (last wins).
    if (params.get("trash") === "1") {
      filters.trash = true;
      filters.archived = false;
    } else if (filters.archived) {
      filters.trash = false;
    }
    const sort = params.get("sort");
    if (sort && (VALID_SORTS as string[]).includes(sort)) {
      filters.sort = sort as NoteSort;
    }
  }
  return { view, filters, capture: null };
}

export function libraryHash(filters: LibraryFiltersState): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type !== "all") params.set("type", filters.type);
  if (filters.categoryId !== "all") params.set("cat", filters.categoryId);
  if (filters.tagIds.length) params.set("tags", filters.tagIds.join(","));
  if (filters.favorite) params.set("fav", "1");
  if (filters.trash) params.set("trash", "1");
  else if (filters.archived) params.set("arch", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  const qs = params.toString();
  return qs ? `#/library?${qs}` : "#/library";
}

export function replaceHash(hash: string): void {
  if (typeof window === "undefined") return;
  if (window.location.hash !== hash) {
    window.history.replaceState(null, "", hash);
  }
}
