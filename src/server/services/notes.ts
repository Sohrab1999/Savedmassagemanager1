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
  sort?: string;
}

export async function listNotes(query: ListNotesQuery): Promise<NoteListResponse> {
  const where: Prisma.NoteWhereInput = { AND: [] };
  const and = where.AND as Prisma.NoteWhereInput[];

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

  const [items, total] = await Promise.all([
    db.note.findMany({
      where,
      orderBy,
      include: noteInclude,
      take: 300,
    }),
    db.note.count({ where }),
  ]);

  return { items: items.map(toNoteDTO), total };
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

export async function deleteNote(id: string): Promise<boolean> {
  const existing = await db.note.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await db.note.delete({ where: { id } });
  return true;
}
