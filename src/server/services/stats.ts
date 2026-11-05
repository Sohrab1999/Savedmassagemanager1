// Dashboard statistics service.

import { db } from "@/lib/db";
import type { NoteType, StatsDTO } from "@/lib/domain/types";
import { noteInclude, toNoteDTO } from "./notes";

export async function getStats(): Promise<StatsDTO> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [total, favorites, archived, thisWeek, typeGroups, categories, recentNotes] =
    await Promise.all([
      db.note.count({ where: { isArchived: false, deletedAt: null } }),
      db.note.count({ where: { isArchived: false, isFavorite: true, deletedAt: null } }),
      db.note.count({ where: { isArchived: true, deletedAt: null } }),
      db.note.count({ where: { isArchived: false, savedAt: { gte: weekAgo }, deletedAt: null } }),
      db.note.groupBy({
        by: ["type"],
        _count: { _all: true },
        where: { isArchived: false, deletedAt: null },
      }),
      db.category.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          _count: { select: { notes: { where: { isArchived: false, deletedAt: null } } } },
        },
      }),
      db.note.findMany({
        where: { isArchived: false, deletedAt: null },
        orderBy: { savedAt: "desc" },
        take: 5,
        include: noteInclude,
      }),
    ]);

  const byType: Record<NoteType, number> = {
    text: 0,
    link: 0,
    image: 0,
    video: 0,
    file: 0,
  };
  for (const group of typeGroups) {
    if (group.type in byType) {
      byType[group.type as NoteType] = group._count._all;
    }
  }

  return {
    total,
    favorites,
    archived,
    thisWeek,
    byType,
    byCategory: categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameFa: category.nameFa,
      icon: category.icon,
      color: category.color,
      count: category._count.notes,
    })),
    recent: recentNotes.map(toNoteDTO),
  };
}
