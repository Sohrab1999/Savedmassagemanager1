import { NextResponse } from "next/server";
import { listResurfaceCandidates } from "@/server/services/stats";

// N7 — resurfacing candidates (demo backend, v1 semantics): the oldest
// non-trashed notes saved ≥30 days ago (archived included), oldest-first.
// v1 deliberately adds NO lastOpenedAt field and NO schema change (recorded
// DoD decision); nothing here sends anything externally — the card and its
// micro-events (src/lib/resurface-metrics.ts) stay on the device.
export async function GET(request: Request) {
  try {
    const parsed = new URL(request.url).searchParams.get("limit");
    const limit = parsed ? Number.parseInt(parsed, 10) : undefined;
    const result = await listResurfaceCandidates(
      Number.isFinite(limit) ? limit : undefined,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/resurface failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
