// Tags service.

import { db } from "@/lib/db";
import type { TagDTO } from "@/lib/domain/types";

export async function listTags(): Promise<TagDTO[]> {
  const tags = await db.tag.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      // Tag.notes goes through the NoteTag join model, so the filtered
      // count traverses the relation: count NoteTag rows whose note is
      // active and not in the trash (S5).
      _count: {
        select: { notes: { where: { note: { isArchived: false, deletedAt: null } } } },
      },
    },
  });
  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    noteCount: tag._count.notes,
  }));
}

export async function createTag(input: { name: string }): Promise<TagDTO> {
  const name = input.name.trim();
  const existing = await db.tag.findUnique({ where: { name } });
  if (existing) {
    return { id: existing.id, name: existing.name, noteCount: 0 };
  }
  const created = await db.tag.create({ data: { name } });
  return { id: created.id, name: created.name, noteCount: 0 };
}

export async function deleteTag(id: string): Promise<boolean> {
  const existing = await db.tag.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await db.tag.delete({ where: { id } });
  return true;
}
