import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/server/services/profile";

export async function GET() {
  try {
    const [profile, categories, tags, notes] = await Promise.all([
      getProfile(),
      db.category.findMany({ orderBy: { order: "asc" } }),
      db.tag.findMany({ orderBy: { createdAt: "asc" } }),
      db.note.findMany({
        orderBy: { savedAt: "desc" },
        include: { tags: { include: { tag: true } } },
      }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      app: "savedbox",
      version: 1,
      profile,
      categories,
      tags,
      notes: notes.map((note) => ({
        ...note,
        tags: note.tags.map((link) => link.tag.name),
      })),
    };

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="savedbox-export-${date}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/export failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
