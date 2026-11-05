import { NextResponse } from "next/server";
import { getProfile, updateProfile } from "@/server/services/profile";
import { updateProfileSchema } from "@/server/schemas";

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/profile failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalid-input" },
        { status: 400 },
      );
    }
    const profile = await updateProfile(parsed.data);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("PATCH /api/profile failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
