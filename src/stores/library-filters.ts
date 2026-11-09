// Library filter/view MODEL — split out of app-store (step 45, owner rule:
// files ≤150–200 lines, no God modules). Pure state shapes + defaults only;
// the store (app-store.ts) and the pure hash parser (hash-navigation.ts)
// both import from here — one direction, no cycles.

import { type NoteSort, type NoteType } from "@/lib/domain/types";

export type AppView = "dashboard" | "library" | "categories" | "settings";

export interface LibraryFiltersState {
  q: string;
  type: NoteType | "all";
  categoryId: string; // 'all' | 'none' | <id>
  tagIds: string[];
  favorite: boolean;
  archived: boolean;
  /** S5 — trash view: shows ONLY soft-deleted notes. Mutually exclusive with
   * `archived` (enforced in the store's setFilters). */
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
