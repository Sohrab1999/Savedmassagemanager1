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
  if (filters.archived) params.set("arch", "1");
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
  setView: (view: AppView) => void;
  openNote: (id: string) => void;
  closeNote: () => void;
  setCaptureOpen: (open: boolean) => void;
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

  setView: (view) => {
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

  setFilters: (patch) => {
    set((state) => ({ filters: { ...state.filters, ...patch } }));
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
