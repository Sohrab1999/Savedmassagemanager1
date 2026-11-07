// Notes service: query building, DTO mapping, tag connectOrCreate logic.

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
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

  const q = query.q?.trim();
  if (q) {
    and.push({
      OR: [
        { title: { contains: q } },
        { content: { contains: q } },
        { description: { contains: q } },
        { url: { contains: q } },
        { fileName: { contains: q } },
        { sourceChat: { contains: q } },
      ],
    });
  }
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

  const orderBy: Prisma.NoteOrderByWithRelationInput =
    query.sort === VALID_SORTS[1]
      ? { savedAt: "asc" }
      : query.sort === VALID_SORTS[2]
        ? { title: "asc" }
        : { savedAt: "desc" };

  const take = Math.min(Math.max(query.pageSize ?? NOTES_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  // Opaque offset cursor: page N starts after N×take rows. Combined with the
  // stable orderBy below this yields deterministic pages.
  const decodedOffset = Number.parseInt(query.pageToken ?? "0", 10);
  const offset = Number.isFinite(decodedOffset) && decodedOffset > 0 ? decodedOffset : 0;

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
  action: "categorize" | "archive" | "unarchive" | "delete" | "restore";
  /** categorize only: null = uncategorize. */
  categoryId?: string | null;
}

export interface BulkNotesResponse {
  ok: true;
  /** How many of the requested ids were actually touched by this action. */
  updated: number;
}

/** Applies one action to many notes in ONE Prisma statement (one SQL batch).
 * State guards keep the semantics consistent with the single-note endpoints:
 * categorize/archive/unarchive/delete only touch live notes; restore only
 * touches notes that are actually in the trash. */
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
  }
  return { ok: true, updated: result.count };
}
