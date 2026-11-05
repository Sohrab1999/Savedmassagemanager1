import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/server/services/categories";
import { updateCategorySchema } from "@/server/schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const category = await updateCategory(id, parsed.data);
    if (!category) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("PATCH /api/categories/[id] failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
