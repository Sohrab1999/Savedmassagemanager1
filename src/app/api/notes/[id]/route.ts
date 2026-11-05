import { NextResponse } from "next/server";
import { deleteNote, getNote, updateNote } from "@/server/services/notes";
import { updateNoteSchema } from "@/server/schemas";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const note = await getNote(id);
    if (!note) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error("GET /api/notes/[id] failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const note = await updateNote(id, parsed.data);
    if (!note) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    console.error("PATCH /api/notes/[id] failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteNote(id);
    if (!deleted) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/notes/[id] failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
