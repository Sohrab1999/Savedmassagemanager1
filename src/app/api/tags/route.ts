import { NextResponse } from "next/server";
import { createTag, listTags } from "@/server/services/tags";
import { createTagSchema } from "@/server/schemas";

export async function GET() {
  try {
    const items = await listTags();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/tags failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const tag = await createTag(parsed.data);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
