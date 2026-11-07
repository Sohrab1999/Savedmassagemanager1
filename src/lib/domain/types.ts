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
  /** N1 — visible Inbox: live, non-archived notes with no category. Feeds the
   * dashboard "uncategorized" card; identical to the library `cat=none` view
   * so the count and the filtered list always agree. */
  uncategorized: number;
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

// ---------------------------------------------------------------------------
// S6 — bulk operations
// ---------------------------------------------------------------------------

export type BulkNoteAction =
  | "categorize"
  | "archive"
  | "unarchive"
  | "delete"
  | "restore"
  /** N5 — permanent delete; server-side guard: only notes already in the
   * trash can be purged. */
  | "purge";

export interface BulkNotesInput {
  ids: string[];
  action: BulkNoteAction;
  /** categorize only: null = uncategorize (move to "none"). */
  categoryId?: string | null;
}

export interface BulkNotesResponse {
  ok: true;
  /** How many of the requested ids the action actually touched. */
  updated: number;
}

// ---------------------------------------------------------------------------
// N5 — trash management (purge + empty-trash)
// ---------------------------------------------------------------------------

/** S5/N5 — soft-deleted notes stay recoverable for this long, then they are
 * purged for good (demo: lazy SQL sweep + explicit purge; cloud: client-side
 * sweep in realtime.ts). Single source of truth for the countdown UI. */
export const TRASH_RETENTION_MS = 7 * 86_400_000;

/** Days left before a soft-deleted note is purged for good.
 * 0 = purges today; null = not in the trash. */
export function trashDaysLeft(
  deletedAt: string | null,
  now: number = Date.now(),
): number | null {
  if (!deletedAt) return null;
  const remaining = TRASH_RETENTION_MS - (now - new Date(deletedAt).getTime());
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 86_400_000);
}

export interface EmptyTrashResponse {
  ok: true;
  deleted: number;
}

// ---------------------------------------------------------------------------
// N2 — JSON import (the counterpart of /api/export)
// ---------------------------------------------------------------------------


/** Result of a merge import. Import NEVER deletes or updates existing
 * records — it only creates. Invalid items and duplicates are skipped and
 * counted so the UI can show an exact report. */
export interface ImportReport {
  ok: true;
  notesAdded: number;
  notesSkippedDuplicates: number;
  notesSkippedInvalid: number;
  categoriesAdded: number;
  tagsAdded: number;
}

// ---------------------------------------------------------------------------
// P3 — real file upload
// ---------------------------------------------------------------------------

export interface UploadedFileInfo {
  /** URL to store on the note (demo: /api/files/<key>; cloud: Storage URL). */
  url: string;
  /** Original client-side filename (metadata only, never used for storage). */
  fileName: string;
  fileSize: number;
}
