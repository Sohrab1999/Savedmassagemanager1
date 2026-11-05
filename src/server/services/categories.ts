// Categories service.

import { db } from "@/lib/db";
import type { CategoryDTO } from "@/lib/domain/types";

interface CategoryInput {
  name?: string;
  nameFa?: string | null;
  icon?: string;
  color?: string;
  order?: number;
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "category";
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const clash = await db.category.findFirst({ where: { slug: base } });
  if (!clash) return base;
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const categories = await db.category.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { notes: { where: { isArchived: false } } } },
    },
  });
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    nameFa: category.nameFa,
    icon: category.icon,
    color: category.color,
    order: category.order,
    noteCount: category._count.notes,
  }));
}

export async function createCategory(input: CategoryInput): Promise<CategoryDTO> {
  const maxOrder = await db.category.aggregate({ _max: { order: true } });
  const created = await db.category.create({
    data: {
      name: input.name ?? "Untitled",
      nameFa: input.nameFa ?? null,
      icon: input.icon ?? "folder",
      color: input.color ?? "#0d9488",
      order: input.order ?? (maxOrder._max.order ?? 0) + 1,
      slug: await uniqueSlug(input.name ?? "category"),
    },
  });
  return { ...created, noteCount: 0 };
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<CategoryDTO | null> {
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) return null;
  await db.category.update({
    where: { id },
    data: {
      name: input.name,
      nameFa: input.nameFa,
      icon: input.icon,
      color: input.color,
      order: input.order,
    },
  });
  const updated = await db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { notes: { where: { isArchived: false } } } },
    },
  });
  if (!updated) return null;
  return {
    id: updated.id,
    slug: updated.slug,
    name: updated.name,
    nameFa: updated.nameFa,
    icon: updated.icon,
    color: updated.color,
    order: updated.order,
    noteCount: updated._count.notes,
  };
}

export async function deleteCategory(id: string): Promise<boolean> {
  const existing = await db.category.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await db.category.delete({ where: { id } });
  return true;
}
