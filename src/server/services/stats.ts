// Dashboard statistics service.

import { db } from "@/lib/db";
import {
  RESURFACE_MIN_AGE_MS,
  RESURFACE_POOL_LIMIT,
} from "@/lib/domain/types";
import type { NoteDTO, NoteType, StatsDTO } from "@/lib/domain/types";
import { noteInclude, toNoteDTO } from "./notes";

export async function getStats(): Promise<StatsDTO> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [total, favorites, archived, thisWeek, uncategorized, typeGroups, categories, recentNotes] =
    await Promise.all([
      db.note.count({ where: { isArchived: false, deletedAt: null } }),
      db.note.count({ where: { isArchived: false, isFavorite: true, deletedAt: null } }),
      db.note.count({ where: { isArchived: true, deletedAt: null } }),
      db.note.count({ where: { isArchived: false, savedAt: { gte: weekAgo }, deletedAt: null } }),
      // N1 — visible Inbox: same view the library `cat=none` filter shows.
      db.note.count({ where: { isArchived: false, deletedAt: null, categoryId: null } }),
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
    uncategorized,
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

// ---------------------------------------------------------------------------
// N7 — resurfacing candidates (v1: oldest-first, NO lastOpenedAt field —
// recorded DoD decision; the card copy «از ذخیره‌های قدیمی‌تان» is honest
// about exactly this semantic)
// ---------------------------------------------------------------------------

/** Oldest non-trashed notes saved at least 30 days ago (archived included —
 * they are the most "forgotten" surface of the library). The dashboard card
 * shows one candidate and «یکی دیگر» walks the list; nothing is ever sent
 * externally (no notifications — owner warning §۶ respected). */
export async function listResurfaceCandidates(
  limit: number = RESURFACE_POOL_LIMIT,
): Promise<{ items: NoteDTO[] }> {
  const cutoff = new Date(Date.now() - RESURFACE_MIN_AGE_MS);
  const rows = await db.note.findMany({
    where: { deletedAt: null, savedAt: { lte: cutoff } },
    orderBy: { savedAt: "asc" },
    take: Math.min(Math.max(Math.trunc(limit), 1), 20),
    include: noteInclude,
  });
  return { items: rows.map(toNoteDTO) };
}
