"use client";

import { create } from "zustand";
import { NOTE_TYPES, type NoteSort, type NoteType } from "@/lib/domain/types";

export type AppView = "dashboard" | "library" | "categories" | "settings";

export interface LibraryFiltersState {
  q: string;
  type: NoteType | "all";
  categoryId: string; // 'all' | 'none' | <id>
  tagIds: string[];
  favorite: boolean;
  archived: boolean;
  /** S5 — trash view: shows ONLY soft-deleted notes. Mutually exclusive with
   * `archived` (enforced in setFilters). */
  trash: boolean;
  sort: NoteSort;
  layout: "grid" | "list";
}

export const defaultLibraryFilters: LibraryFiltersState = {
  q: "",
  type: "all",
  categoryId: "all",
  tagIds: [],
  favorite: false,
  archived: false,
  trash: false,
  sort: "newest",
  layout: "grid",
};

const VALID_VIEWS: AppView[] = [
  "dashboard",
  "library",
  "categories",
  "settings",
];
const VALID_SORTS: NoteSort[] = ["newest", "oldest", "title"];

function viewFromPath(raw: string): AppView {
  return VALID_VIEWS.includes(raw as AppView) ? (raw as AppView) : "dashboard";
}

// ---------------------------------------------------------------------------
// S3 — filters in the URL hash (#/library?q=…&type=…&cat=…&tags=…&fav=1&arch=1&sort=…)
//
// • Only non-default values are serialized (short, readable deep-links).
// • `layout` stays a device preference and is never serialized.
// • Filter changes use history.replaceState (they are refinements of the
//   current view, not navigations — this also keeps the debounced search from
//   flooding the history stack). View changes keep pushState, so browser
//   back/forward remains view-level and always works.
// • Malformed values are ignored (defaults apply) — the hash is untrusted input.
// ---------------------------------------------------------------------------

interface HashRoute {
  view: AppView;
  filters: LibraryFiltersState;
}

function parseHash(hash: string): HashRoute {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
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
  return { view, filters };
}

function libraryHash(filters: LibraryFiltersState): string {
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

function replaceHash(hash: string): void {
  if (typeof window === "undefined") return;
  if (window.location.hash !== hash) {
    window.history.replaceState(null, "", hash);
  }
}

interface AppState {
  view: AppView;
  detailNoteId: string | null;
  captureOpen: boolean;
  filters: LibraryFiltersState;
  /** S6 — bulk-selection mode lives here so the mobile capture FAB can hide
   * itself while selecting (the two flows must not overlap). */
  bulkSelectMode: boolean;
  /** UX-B3 (T-3) — the ONE search/command surface: opened by ⌘K (global),
   * by the header search trigger (desktop pill + mobile icon). */
  paletteOpen: boolean;
  setView: (view: AppView) => void;
  openNote: (id: string) => void;
  closeNote: () => void;
  setCaptureOpen: (open: boolean) => void;
  setBulkSelectMode: (active: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setFilters: (patch: Partial<LibraryFiltersState>) => void;
  resetFilters: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Deterministic initial view for SSR + first client render; the hash is
  // synced after hydration (bindHashNavigation) to avoid hydration mismatch.
  view: "dashboard",
  detailNoteId: null,
  captureOpen: false,
  filters: { ...defaultLibraryFilters },
  bulkSelectMode: false,
  // UX-B3 — the unified ⌘K palette starts closed (deterministic SSR value).
  paletteOpen: false,

  setView: (view) => {
    // Leaving the library always ends bulk selection.
    if (view !== "library") set({ bulkSelectMode: false });
    if (typeof window !== "undefined") {
      // Deep-linkable library hash carries the active filters (S3).
      const hash = view === "library" ? libraryHash(get().filters) : view === "dashboard" ? "#/" : `#/${view}`;
      if (window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
      }
    }
    set({ view });
  },

  openNote: (id) => set({ detailNoteId: id }),
  closeNote: () => set({ detailNoteId: null }),
  setCaptureOpen: (open) => set({ captureOpen: open }),
  setBulkSelectMode: (active) => set({ bulkSelectMode: active }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),

  setFilters: (patch) => {
    set((state) => {
      const next = { ...state.filters, ...patch };
      // S5 — archived and trash are different views of the library; enabling
      // one clears the other (also keeps the active-filter bar unambiguous).
      if (patch.trash === true) next.archived = false;
      if (patch.archived === true) next.trash = false;
      return { filters: next };
    });
    if (get().view === "library") {
      replaceHash(libraryHash(get().filters));
    }
  },

  resetFilters: () => {
    set({ filters: { ...defaultLibraryFilters } });
    if (get().view === "library") {
      replaceHash("#/library");
    }
  },
}));

/** Re-sync store view + filters when the user navigates with browser
 * back/forward, opens a deep-link, or refreshes. */
export function bindHashNavigation(): () => void {
  if (typeof window === "undefined") return () => undefined;
  // Align with the URL after hydration (external-store update, no React setState).
  const initial = parseHash(window.location.hash);
  useAppStore.setState({ view: initial.view, filters: initial.filters });
  const onHashChange = () => {
    const next = parseHash(window.location.hash);
    useAppStore.setState({ view: next.view, filters: next.filters });
  };
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("popstate", onHashChange);
  return () => {
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("popstate", onHashChange);
  };
}
