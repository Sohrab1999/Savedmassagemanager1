import { NextResponse } from "next/server";
import { createNote, listNotes } from "@/server/services/notes";
import { ensureProfileId } from "@/server/services/profile";
import { createNoteSchema } from "@/server/schemas";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const archivedParam = params.get("archived");
    const result = await listNotes({
      q: params.get("q") ?? undefined,
      type: params.get("type") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      tagIds:
        params.get("tagIds")?.split(",").map((id) => id.trim()).filter(Boolean) ??
        undefined,
      favorite: params.get("favorite") === "true" || undefined,
      archived:
        archivedParam === null ? undefined : archivedParam === "true",
      sort: params.get("sort") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notes failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const userId = await ensureProfileId();
    const note = await createNote(parsed.data, userId);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
