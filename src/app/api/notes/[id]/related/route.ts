import { NextResponse } from "next/server";
import { getRelatedNotes } from "@/server/services/notes";

// N6 — related notes (demo backend): up to 3 items with a GENUINE shared tag
// or category, ranked by the shared pure co-occurrence scorer
// (src/lib/related.ts — the same function the cloud live-array path uses).
// No AI anywhere; [] when nothing genuinely connects (the UI hides the
// section entirely in that case).
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const items = await getRelatedNotes(id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/notes/[id]/related failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
