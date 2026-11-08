import { NextResponse } from "next/server";
import { resetSeed } from "@/server/seed";

/** Demo-mode only. Optional { extraNotes: n } body scales the library to n
 * deterministic filler notes (S1 600-item scenario; default 0, capped 1000). */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      extraNotes?: unknown;
    };
    const extraNotes =
      typeof body.extraNotes === "number" && Number.isFinite(body.extraNotes)
        ? body.extraNotes
        : undefined;
    const counts = await resetSeed({ extraNotes });
    return NextResponse.json({ ok: true, counts });
  } catch (error) {
    console.error("POST /api/seed failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
