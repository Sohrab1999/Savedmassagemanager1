import { NextResponse } from "next/server";
import { deleteTag } from "@/server/services/tags";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteTag(id);
    if (!deleted) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tags/[id] failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
