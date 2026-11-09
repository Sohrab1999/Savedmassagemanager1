"use client";

import { create } from "zustand";
import { type CapturePrefill } from "@/lib/capture/capture-prefill";
import {
  libraryHash,
  parseHash,
  replaceHash,
} from "@/stores/hash-navigation";
import {
  defaultLibraryFilters,
  type AppView,
  type LibraryFiltersState,
} from "@/stores/library-filters";

export interface AppState {
  view: AppView;
  detailNoteId: string | null;
  /** UX-B6 — true ONLY when the sheet was opened by an explicit organize
   * intent (the capture-success toast CTA); the sheet then lands directly in
   * edit mode. Regular opens never set it. */
  detailAutoEdit: boolean;
  /** F6 — the FIRST item of the current sheet session. Non-null while the
   * user is browsing related items inside the sheet; the back bar returns
   * exactly here. A regular openNote() starts a fresh session (null). */
  detailRootId: string | null;
  captureOpen: boolean;
  /** F1/F2 — the external-channel payload (share target / `#/capture`).
   * Consumed by QuickCapture on open; cleared on close/plain opens. */
  capturePrefill: CapturePrefill | null;
  filters: LibraryFiltersState;
  /** S6 — bulk-selection mode lives here so the mobile capture FAB can hide
   * itself while selecting (the two flows must not overlap). */
  bulkSelectMode: boolean;
  /** UX-B3 (T-3) — the ONE search/command surface: opened by ⌘K (global),
   * by the header search trigger (desktop pill + mobile icon). */
  paletteOpen: boolean;
  setView: (view: AppView) => void;
  openNote: (id: string, opts?: { autoEdit?: boolean }) => void;
  /** F6 — opening a RELATED item keeps the session root; depth ≥2 shows the
   * back bar. The B6 transition flag is always cleared here (contract). */
  openRelatedNote: (id: string) => void;
  /** F6 — one tap back to the FIRST item of the session (exact per DoD). */
  returnToDetailRoot: () => void;
  closeNote: () => void;
  setCaptureOpen: (open: boolean) => void;
  /** F1/F2 — open the capture dialog carrying an external-channel prefill.
   * The ONLY path that may set a payload; plain opens/closes clear it, so a
   * share payload can never leak into a later dialog session. */
  openCapture: (prefill?: CapturePrefill) => void;
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
  // UX-B6 — the organize bridge is OFF by default (deterministic SSR value).
  detailAutoEdit: false,
  // F6 — no related-session root until a related item is opened in-session.
  detailRootId: null,
  captureOpen: false,
  capturePrefill: null,
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

  openNote: (id, opts) =>
    set({
      detailNoteId: id,
      detailAutoEdit: opts?.autoEdit === true,
      // F6 — every regular open starts a NEW sheet session.
      detailRootId: null,
    }),

  openRelatedNote: (id) =>
    set((state) => ({
      detailNoteId: id,
      // F6 — the B6 flag is a single-transition intent; navigating deeper
      // always lands view-first (B2 contract preserved).
      detailAutoEdit: false,
      detailRootId: state.detailRootId ?? state.detailNoteId,
    })),

  returnToDetailRoot: () =>
    set((state) =>
      state.detailRootId
        ? { detailNoteId: state.detailRootId, detailAutoEdit: false }
        : {},
    ),

  closeNote: () =>
    set({ detailNoteId: null, detailAutoEdit: false, detailRootId: null }),

  setCaptureOpen: (open) =>
    // Plain opens (FAB/header/palette) and closes both clear any payload —
    // this is what guarantees the prefill is applied EXACTLY once (the
    // render-phase transition in QuickCapture never writes to the store).
    set({ captureOpen: open, capturePrefill: null }),

  openCapture: (prefill) =>
    set({ captureOpen: true, capturePrefill: prefill ?? null }),

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
 * back/forward, opens a deep-link, or refreshes. F1/F2 — a `#/capture?…`
 * hash (share/bookmarklet) instead OPENS the capture dialog (prefilled or
 * plain) and the hash is consumed, so back/forward and refresh never
 * re-trigger it. The current view/filters are kept untouched for capture
 * routes (capture is an overlay, not a view change). */
export function bindHashNavigation(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const applyRoute = () => {
    const route = parseHash(window.location.hash);
    if (route.capture) {
      useAppStore.getState().openCapture(route.capture);
      replaceHash("#/");
      return;
    }
    useAppStore.setState({ view: route.view, filters: route.filters });
  };
  applyRoute();
  window.addEventListener("hashchange", applyRoute);
  window.addEventListener("popstate", applyRoute);
  return () => {
    window.removeEventListener("hashchange", applyRoute);
    window.removeEventListener("popstate", applyRoute);
  };
}

// Re-exported for existing import sites (`AppView`, `LibraryFiltersState`,
// `defaultLibraryFilters` were previously declared here).
export { defaultLibraryFilters } from "@/stores/library-filters";
export type { AppView, LibraryFiltersState } from "@/stores/library-filters";
export type { CapturePrefill } from "@/lib/capture/capture-prefill";
