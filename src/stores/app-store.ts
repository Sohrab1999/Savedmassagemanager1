"use client";

import { create } from "zustand";
import type { NoteSort, NoteType } from "@/lib/domain/types";

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

function viewFromHash(): AppView {
  if (typeof window === "undefined") return "dashboard";
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return VALID_VIEWS.includes(raw as AppView) ? (raw as AppView) : "dashboard";
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

export const useAppStore = create<AppState>((set) => ({
  // Deterministic initial view for SSR + first client render; the hash is
  // synced after hydration (bindHashNavigation) to avoid hydration mismatch.
  view: "dashboard",
  detailNoteId: null,
  captureOpen: false,
  filters: { ...defaultLibraryFilters },

  setView: (view) => {
    if (typeof window !== "undefined") {
      const hash = view === "dashboard" ? "#/" : `#/${view}`;
      if (window.location.hash !== hash) {
        window.history.pushState(null, "", hash);
      }
    }
    set({ view });
  },

  openNote: (id) => set({ detailNoteId: id }),
  closeNote: () => set({ detailNoteId: null }),
  setCaptureOpen: (open) => set({ captureOpen: open }),

  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: { ...defaultLibraryFilters } }),
}));

/** Re-sync store view when the user navigates with browser back/forward. */
export function bindHashNavigation(): () => void {
  if (typeof window === "undefined") return () => undefined;
  // Align with the URL after hydration (external-store update, no React setState).
  useAppStore.setState({ view: viewFromHash() });
  const onHashChange = () => {
    useAppStore.setState({ view: viewFromHash() });
  };
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("popstate", onHashChange);
  return () => {
    window.removeEventListener("hashchange", onHashChange);
    window.removeEventListener("popstate", onHashChange);
  };
}
