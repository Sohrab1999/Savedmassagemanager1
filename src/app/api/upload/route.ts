import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_DIR,
  allowlistedExtension,
} from "@/server/storage";

export const runtime = "nodejs";

// P3 — real file upload for «فایل/تصویر» notes captured by hand (demo backend).
// Multipart in → validated, allowlisted file on disk + metadata out.
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing-file" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "empty-file" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "file-too-large" }, { status: 413 });
    }
    const ext = allowlistedExtension(file.name, file.type);
    if (!ext) {
      return NextResponse.json({ error: "unsupported-type" }, { status: 415 });
    }

    const key = `${randomUUID()}.${ext}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);

    return NextResponse.json(
      {
        url: `/api/files/${key}`,
        fileName: file.name,
        fileSize: file.size,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/upload failed:", error);
    return NextResponse.json({ error: "upload-failed" }, { status: 500 });
  }
}
