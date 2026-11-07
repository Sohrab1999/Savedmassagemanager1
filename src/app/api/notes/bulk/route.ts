import { NextResponse } from "next/server";
import { bulkUpdateNotes } from "@/server/services/notes";
import { bulkNoteSchema } from "@/server/schemas";

// S6 — bulk operations endpoint (demo backend). One request = one Prisma
// statement on the demo backend and one committed writeBatch (≤500 ops) on the
// cloud backend, so "categorize 10 items in one batch" is a single write unit.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bulkNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const result = await bulkUpdateNotes(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "category-not-found") {
      return NextResponse.json({ error: "category-not-found" }, { status: 400 });
    }
    console.error("POST /api/notes/bulk failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
