import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/server/services/categories";
import { createCategorySchema } from "@/server/schemas";

export async function GET() {
  try {
    const items = await listCategories();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/categories failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const category = await createCategory(parsed.data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
