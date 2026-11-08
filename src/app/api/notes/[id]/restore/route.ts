import { NextResponse } from "next/server";
import { restoreNote } from "@/server/services/notes";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** S5 — Undo: removes a soft-deleted note from the trash (deletedAt cleared). */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const restored = await restoreNote(id);
    if (!restored) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/notes/[id]/restore failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
