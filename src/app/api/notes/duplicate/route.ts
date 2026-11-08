import { NextResponse } from "next/server";
import { findDuplicateNote } from "@/server/services/notes";

// N10 — capture-time duplicate check (demo backend). STATIC segment: Next.js
// matches the literal `duplicate` before the sibling `[id]` dynamic route, so
// this path can never be swallowed by the note-by-id GET.
// SOFT WARNING ONLY — the response feeds an informational banner; nothing in
// the capture flow is blocked by it, and nothing is ever deleted automatically.
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const url = params.get("url");
    const title = params.get("title");
    if (!url && !title) {
      return NextResponse.json({ error: "duplicate.no-input" }, { status: 400 });
    }
    const result = await findDuplicateNote({ url, title });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/notes/duplicate failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
