import { NextResponse } from "next/server";
import { getStats } from "@/server/services/stats";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
