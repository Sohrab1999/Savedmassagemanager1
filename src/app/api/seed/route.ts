import { NextResponse } from "next/server";
import { resetSeed } from "@/server/seed";

export async function POST() {
  try {
    const counts = await resetSeed();
    return NextResponse.json({ ok: true, counts });
  } catch (error) {
    console.error("POST /api/seed failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
