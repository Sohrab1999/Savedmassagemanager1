// Notes service: query building, DTO mapping, tag connectOrCreate logic.

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizePersian } from "@/lib/persian";
import { relatedNotes, RELATED_LIMIT } from "@/lib/related";
import { UPLOAD_DIR, isValidFileKey } from "@/server/storage";
import type {
  CreateNoteInput,
  NoteDTO,
  NoteListResponse,
  NoteSort,
  NoteType,
  UpdateNoteInput,
} from "@/lib/domain/types";

export const noteInclude = {
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
      nameFa: true,
      icon: true,
      color: true,
    },
  },
  tags: { include: { tag: { select: { id: true, name: true } } } },
} satisfies Prisma.NoteInclude;

type NoteWithRelations = Prisma.NoteGetPayload<{ include: typeof noteInclude }>;

const VALID_TYPES: NoteType[] = ["text", "link", "image", "video", "file"];
const VALID_SORTS: NoteSort[] = ["newest", "oldest", "title"];

export function toNoteDTO(note: NoteWithRelations): NoteDTO {
  return {
    id: note.id,
    type: (VALID_TYPES.includes(note.type as NoteType)
      ? note.type
      : "text") as NoteType,
    title: note.title,
    content: note.content,
    description: note.description,
    url: note.url,
    mediaUrl: note.mediaUrl,
    fileName: note.fileName,
    fileSize: note.fileSize,
    mediaDuration: note.mediaDuration,
    sourceChat: note.sourceChat,
    sourceType: note.sourceType,
    categoryId: note.categoryId,
    category: note.category,
    tags: note.tags.map((link) => ({
      id: link.tag.id,
      name: link.tag.name,
    })),
    isFavorite: note.isFavorite,
    isArchived: note.isArchived,
    deletedAt: note.deletedAt ? note.deletedAt.toISOString() : null,
    savedAt: note.savedAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export interface ListNotesQuery {
  q?: string;
  type?: string;
  categoryId?: string;
  tagIds?: string[];
  favorite?: boolean;
  archived?: boolean;
  /** S5 — trash view: list ONLY soft-deleted notes when true. */
  trash?: boolean;
  sort?: string;
  pageToken?: string;
  pageSize?: number;
}

/** S1: page size for the paginated notes list (UI shows a "load more" per page). */
export const NOTES_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

/** S5 — hard-delete notes that have been in the trash for 7+ days. Runs
 * lazily before every list (the demo equivalent of the realtime store's
 * client-side sweep in cloud mode). */
async function purgeExpiredTrash(): Promise<void> {
  await db.note.deleteMany({
    where: { deletedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
  });
}

export async function listNotes(query: ListNotesQuery): Promise<NoteListResponse> {
  await purgeExpiredTrash();

  const where: Prisma.NoteWhereInput = { AND: [] };
  const and = where.AND as Prisma.NoteWhereInput[];

  // S5 — the default views never show trashed notes; the trash view shows
  // only them. Archived/favorite/type filters compose inside the view.
  and.push(query.trash ? { deletedAt: { not: null } } : { deletedAt: null });

  // N3 — Persian search normalization. SQLite `contains` compares raw bytes,
  // so «كتاب» (Arabic kaf) would miss «کتاب». When a query is present we drop
  // the textual condition here and filter IN MEMORY through
  // `normalizePersian` (compare-only — stored data is untouched). Demo scale
  // (single-user SQLite) makes the full fetch safe; the cloud backend does
  // the same folding client-side over the live G1 array.
  const q = query.q?.trim();
  const normalizedQuery = q ? normalizePersian(q) : "";
  if (query.type && VALID_TYPES.includes(query.type as NoteType)) {
    and.push({ type: query.type });
  }
  if (query.categoryId === "none") {
    and.push({ categoryId: null });
  } else if (query.categoryId) {
    and.push({ categoryId: query.categoryId });
  }
  if (query.favorite) and.push({ isFavorite: true });
  if (query.archived !== undefined) and.push({ isArchived: query.archived });
  if (query.tagIds?.length) {
    for (const tagId of query.tagIds) {
      and.push({ tags: { some: { tagId } } });
    }
  }

  const take = Math.min(Math.max(query.pageSize ?? NOTES_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  // Opaque offset cursor: page N starts after N×take rows.
  const decodedOffset = Number.parseInt(query.pageToken ?? "0", 10);
  const offset = Number.isFinite(decodedOffset) && decodedOffset > 0 ? decodedOffset : 0;

  // N3 — normalized in-memory search path (query present).
  if (normalizedQuery) {
    const candidates = await db.note.findMany({ where, include: noteInclude });
    const matched = candidates.filter((note) => {
      const fields = [
        note.title,
        note.content,
        note.description,
        note.url,
        note.fileName,
        note.sourceChat,
      ];
      return fields.some(
        (field) => typeof field === "string" && normalizePersian(field).includes(normalizedQuery),
      );
    });
    // Mirror the SQL orderBy so page semantics stay identical with/without q.
    if (query.sort === VALID_SORTS[1]) {
      matched.sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime());
    } else if (query.sort === VALID_SORTS[2]) {
      matched.sort((a, b) => (a.title < b.title ? -1 : a.title > b.title ? 1 : 0));
    } else {
      matched.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
    }
    const total = matched.length;
    const items = matched.slice(offset, offset + take);
    const nextOffset = offset + items.length;
    return {
      items: items.map(toNoteDTO),
      total,
      nextCursor: nextOffset < total ? String(nextOffset) : null,
    };
  }

  const orderBy: Prisma.NoteOrderByWithRelationInput =
    query.sort === VALID_SORTS[1]
      ? { savedAt: "asc" }
      : query.sort === VALID_SORTS[2]
        ? { title: "asc" }
        : { savedAt: "desc" };

  const [items, total] = await Promise.all([
    db.note.findMany({
      where,
      orderBy,
      include: noteInclude,
      take,
      skip: offset,
    }),
    db.note.count({ where }),
  ]);

  const nextOffset = offset + items.length;
  return {
    items: items.map(toNoteDTO),
    total,
    nextCursor: nextOffset < total ? String(nextOffset) : null,
  };
}

export async function getNote(id: string): Promise<NoteDTO | null> {
  const note = await db.note.findUnique({ where: { id }, include: noteInclude });
  return note ? toNoteDTO(note) : null;
}

// ---------------------------------------------------------------------------
// N6 — related notes (co-occurrence, NO AI — shared scorer in lib/related.ts)
// ---------------------------------------------------------------------------

/** Up to `RELATED_LIMIT` notes that genuinely share tags or a category with
 * `id`. The pool = every non-trashed note (archived included — DoD decision);
 * the PURE scorer in `lib/related.ts` is the single ranking source for both
 * backends. Returns [] when nothing genuinely connects. */
export async function getRelatedNotes(
  id: string,
  limit: number = RELATED_LIMIT,
): Promise<NoteDTO[]> {
  const current = await getNote(id);
  if (!current) return [];
  const pool = await db.note.findMany({
    where: { deletedAt: null },
    include: noteInclude,
  });
  return relatedNotes(current, pool.map(toNoteDTO), limit);
}

export async function createNote(
  input: CreateNoteInput,
  userId: string,
): Promise<NoteDTO> {
  const note = await db.note.create({
    data: {
      type: input.type,
      title: input.title,
      content: input.content ?? null,
      description: input.description ?? null,
      url: input.url || null,
      mediaUrl: input.mediaUrl || null,
      fileName: input.fileName ?? null,
      fileSize: input.fileSize ?? null,
      mediaDuration: input.mediaDuration ?? null,
      sourceChat: input.sourceChat ?? null,
      sourceType: input.sourceType ?? "manual",
      categoryId: input.categoryId || null,
      userId,
      tags: {
        create: (input.tagNames ?? []).map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
    include: noteInclude,
  });
  return toNoteDTO(note);
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<NoteDTO | null> {
  const existing = await db.note.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  const data: Prisma.NoteUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.description !== undefined) data.description = input.description;
  if (input.url !== undefined) data.url = input.url || null;
  if (input.mediaUrl !== undefined) data.mediaUrl = input.mediaUrl || null;
  if (input.fileName !== undefined) data.fileName = input.fileName;
  if (input.fileSize !== undefined) data.fileSize = input.fileSize;
  if (input.mediaDuration !== undefined) data.mediaDuration = input.mediaDuration;
  if (input.sourceChat !== undefined) data.sourceChat = input.sourceChat;
  if (input.type !== undefined) data.type = input.type;
  if (input.isFavorite !== undefined) data.isFavorite = input.isFavorite;
  if (input.isArchived !== undefined) data.isArchived = input.isArchived;
  if (input.categoryId !== undefined) {
    data.category =
      input.categoryId === null || input.categoryId === ""
        ? { disconnect: true }
        : { connect: { id: input.categoryId } };
  }

  if (input.tagNames !== undefined) {
    data.tags = {
      deleteMany: {},
      create: input.tagNames.map((name) => ({
        tag: { connectOrCreate: { where: { name }, create: { name } } },
      })),
    };
  }

  const note = await db.note.update({
    where: { id },
    data,
    include: noteInclude,
  });
  return toNoteDTO(note);
}

/** S5 — soft delete: the note moves to the trash (deletedAt set) and is
 * recoverable for 7 days; the lazy purge removes it permanently afterwards. */
export async function deleteNote(id: string): Promise<boolean> {
  const existing = await db.note.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await db.note.update({ where: { id }, data: { deletedAt: new Date() } });
  return true;
}

/** S5 — undo: leaves the trash (deletedAt cleared). */
export async function restoreNote(id: string): Promise<boolean> {
  const existing = await db.note.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await db.note.update({ where: { id }, data: { deletedAt: null } });
  return true;
}

// ---------------------------------------------------------------------------
// S6 — bulk operations
// ---------------------------------------------------------------------------

export interface BulkNotesInput {
  ids: string[];
  action: "categorize" | "archive" | "unarchive" | "delete" | "restore" | "purge";
  /** categorize only: null = uncategorize. */
  categoryId?: string | null;
}

export interface BulkNotesResponse {
  ok: true;
  /** How many of the requested ids were actually touched by this action. */
  updated: number;
}

/** N5 — dependency cleanup for permanent deletes: uploaded files (P3) live on
 * disk under db/uploads and are referenced as /api/files/<key>. Only keys that
 * pass `isValidFileKey` (server-issued UUIDs) are ever touched — user input
 * can never select an arbitrary path. Best-effort: a missing file is ignored. */
async function purgeAttachments(
  mediaUrls: Array<string | null>,
): Promise<void> {
  for (const mediaUrl of mediaUrls) {
    if (!mediaUrl?.startsWith("/api/files/")) continue;
    const key = mediaUrl.slice("/api/files/".length);
    if (!isValidFileKey(key)) continue;
    try {
      await fs.unlink(path.join(UPLOAD_DIR, key));
    } catch {
      /* already gone — nothing to clean */
    }
  }
}

/** Applies one action to many notes in ONE Prisma statement (one SQL batch).
 * State guards keep the semantics consistent with the single-note endpoints:
 * categorize/archive/unarchive/delete only touch live notes; restore and the
 * N5 `purge` only touch notes that are actually in the trash. */
export async function bulkUpdateNotes(
  input: BulkNotesInput,
): Promise<BulkNotesResponse> {
  const liveWhere = { id: { in: input.ids }, deletedAt: null };
  const trashedWhere = { id: { in: input.ids }, deletedAt: { not: null } };

  let result: { count: number };
  switch (input.action) {
    case "categorize": {
      const categoryId = input.categoryId || null;
      if (categoryId) {
        const category = await db.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });
        if (!category) {
          throw new Error("category-not-found");
        }
      }
      result = await db.note.updateMany({
        where: liveWhere,
        data: { categoryId },
      });
      break;
    }
    case "archive":
      result = await db.note.updateMany({
        where: liveWhere,
        data: { isArchived: true },
      });
      break;
    case "unarchive":
      result = await db.note.updateMany({
        where: { ...liveWhere, isArchived: true },
        data: { isArchived: false },
      });
      break;
    case "delete":
      result = await db.note.updateMany({
        where: liveWhere,
        data: { deletedAt: new Date() },
      });
      break;
    case "restore":
      result = await db.note.updateMany({
        where: trashedWhere,
        data: { deletedAt: null },
      });
      break;
    case "purge": {
      // N5 — permanent delete. Guarded to trashed notes only; NoteTag rows
      // cascade (schema onDelete: Cascade) and tags/categories themselves are
      // independent records — nothing else is removed.
      const doomed = await db.note.findMany({
        where: trashedWhere,
        select: { id: true, mediaUrl: true },
      });
      if (doomed.length === 0) {
        result = { count: 0 };
        break;
      }
      result = await db.note.deleteMany({
        where: { id: { in: doomed.map((note) => note.id) } },
      });
      await purgeAttachments(doomed.map((note) => note.mediaUrl));
      break;
    }
  }
  return { ok: true, updated: result.count };
}

// ---------------------------------------------------------------------------
// N5 — empty trash
// ---------------------------------------------------------------------------

/** N5 — permanently deletes EVERY soft-deleted note in one SQL statement;
 * uploaded attachment files are unlinked best-effort afterwards. Tags and
 * categories are never touched (they are independent records). */
export async function emptyTrash(): Promise<{ ok: true; deleted: number }> {
  const doomed = await db.note.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, mediaUrl: true },
  });
  if (doomed.length === 0) return { ok: true, deleted: 0 };
  const result = await db.note.deleteMany({
    where: { deletedAt: { not: null } },
  });
  await purgeAttachments(doomed.map((note) => note.mediaUrl));
  return { ok: true, deleted: result.count };
}
