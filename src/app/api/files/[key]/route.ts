import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { FILE_CONTENT_TYPES, UPLOAD_DIR, isValidFileKey } from "@/server/storage";

export const runtime = "nodejs";

// P3 — serves uploaded files back to the UI. Keys are server-issued UUIDs
// (validated), so neither traversal nor arbitrary reads are possible; the
// content type comes from the stored allowlisted extension, never from input.
interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { key } = await context.params;
  if (!isValidFileKey(key)) {
    return NextResponse.json({ error: "invalid-key" }, { status: 400 });
  }
  const ext = (key.split(".").pop() ?? "").toLowerCase();
  const contentType = FILE_CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "unsupported-type" }, { status: 415 });
  }
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, key));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
}
