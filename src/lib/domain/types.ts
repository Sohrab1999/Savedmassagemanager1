// Shared domain DTOs used by both the API layer and the UI.
// Dates are ISO strings after JSON serialization.

export const NOTE_TYPES = ["text", "link", "image", "video", "file"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export type NoteSort = "newest" | "oldest" | "title";

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  icon: string;
  color: string;
}

export interface CategoryDTO extends CategoryRef {
  order: number;
  noteCount: number;
}

export interface TagDTO {
  id: string;
  name: string;
  noteCount: number;
}

export interface TagRef {
  id: string;
  name: string;
}

export interface NoteDTO {
  id: string;
  type: NoteType;
  title: string;
  content: string | null;
  description: string | null;
  url: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mediaDuration: number | null;
  sourceChat: string | null;
  sourceType: string;
  categoryId: string | null;
  category: CategoryRef | null;
  tags: TagRef[];
  isFavorite: boolean;
  isArchived: boolean;
  /** S5 — soft delete. null while the note is live; ISO timestamp of the
   * moment it moved to the trash. Purged permanently after 7 days. */
  deletedAt: string | null;
  savedAt: string;
  updatedAt: string;
}

export interface NoteListResponse {
  items: NoteDTO[];
  total: number;
  /** Opaque cursor for the next page (S1); null when no more pages. */
  nextCursor: string | null;
}

export interface StatsDTO {
  total: number;
  favorites: number;
  archived: number;
  thisWeek: number;
  byType: Record<NoteType, number>;
  byCategory: Array<CategoryRef & { count: number }>;
  recent: NoteDTO[];
}

export interface ProfileDTO {
  id: string;
  displayName: string;
  username: string | null;
  locale: string;
  theme: string | null;
}

export interface NoteFilters {
  q?: string;
  type?: NoteType | "all";
  categoryId?: string; // 'all' | 'none' | <id>
  tagIds?: string[];
  favorite?: boolean;
  archived?: boolean;
  sort?: NoteSort;
  /** S1 pagination: opaque cursor from the previous response. */
  pageToken?: string;
  /** S1 pagination: page size (server clamps to its own maximum). */
  pageSize?: number;
  /** S5 — trash view: when true, list ONLY soft-deleted notes. */
  trash?: boolean;
}

export interface CreateNoteInput {
  type: NoteType;
  title: string;
  content?: string | null;
  description?: string | null;
  url?: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mediaDuration?: number | null;
  sourceChat?: string | null;
  sourceType?: "manual" | "telegram";
  categoryId?: string | null;
  tagNames?: string[];
}

export type UpdateNoteInput = Partial<
  Omit<CreateNoteInput, "type"> & {
    type?: NoteType;
    isFavorite?: boolean;
    isArchived?: boolean;
  }
>;
