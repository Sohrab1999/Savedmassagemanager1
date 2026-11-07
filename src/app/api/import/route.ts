// N2 — JSON import endpoint (demo backend). The counterpart of /api/export.
// Causal errors: import.invalid-json → import.too-large →
// import.not-a-savedbox-export / import.invalid-schema (zod). The merge
// itself never deletes or updates — see server/services/import.ts.

import { NextResponse } from "next/server";
import { importPayloadSchema } from "@/lib/domain/import-schema";
import { ImportValidationError, importData } from "@/server/services/import";
import { ensureProfileId } from "@/server/services/profile";

/** Body cap: 20 MB of JSON is far above any honest export at demo scale and
 * stops resource-exhaustion imports early. */
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_IMPORT_BYTES) {
      return NextResponse.json({ error: "import.too-large" }, { status: 413 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (body === null || typeof body !== "object") {
      return NextResponse.json({ error: "import.invalid-json" }, { status: 400 });
    }

    const parsed = importPayloadSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message;
      const code =
        message === "not-a-savedbox-export"
          ? "import.not-a-savedbox-export"
          : "import.invalid-schema";
      return NextResponse.json({ error: code }, { status: 400 });
    }

    const userId = await ensureProfileId();
    const report = await importData(parsed.data, userId);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof ImportValidationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    console.error("POST /api/import failed:", error);
    return NextResponse.json({ error: "internal-error" }, { status: 500 });
  }
}
