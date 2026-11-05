// Seed service: deterministic reset to the realistic sample content.
// Used by POST /api/seed and scripts/seed.ts.

import { db } from "@/lib/db";
import { seedCategories, seedNotes, seedTags } from "./seed-data";

export interface SeedCounts {
  notes: number;
  categories: number;
  tags: number;
}

export async function resetSeed(): Promise<SeedCounts> {
  await db.noteTag.deleteMany();
  await db.note.deleteMany();
  await db.tag.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();

  await db.user.create({
    data: { displayName: "سهراب", username: "sohrab", locale: "fa" },
  });

  const categoryIdBySlug = new Map<string, string>();
  for (const category of seedCategories) {
    const created = await db.category.create({ data: { ...category } });
    categoryIdBySlug.set(category.slug, created.id);
  }

  const tagIdByName = new Map<string, string>();
  for (const name of seedTags) {
    const created = await db.tag.create({ data: { name } });
    tagIdByName.set(name, created.id);
  }

  let noteCount = 0;
  for (const note of seedNotes) {
    const { categorySlug, tagNames, minutesAgo, ...fields } = note;
    await db.note.create({
      data: {
        ...fields,
        savedAt: new Date(Date.now() - minutesAgo * 60_000),
        categoryId: categorySlug ? (categoryIdBySlug.get(categorySlug) ?? null) : null,
        tags: {
          create: tagNames
            .map((name) => ({ tagId: tagIdByName.get(name) }))
            .filter((row): row is { tagId: string } => Boolean(row.tagId)),
        },
      },
    });
    noteCount += 1;
  }

  return {
    notes: noteCount,
    categories: seedCategories.length,
    tags: seedTags.length,
  };
}
