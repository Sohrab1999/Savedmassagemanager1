// P3 — shared constants for the real-file upload feature («فایل/تصویر» notes).
//
// Security stance (ecc-security-review checklist):
//  • extension allowlist — unknown types are rejected, never guessed;
//  • stored filename = server-generated UUID + allowlisted extension, so the
//    user-supplied name NEVER touches the filesystem (no traversal, no
//    overwrites, no execution risk);
//  • content type is derived from the stored extension (never from the client
//    header) and served with nosniff.

import path from "node:path";

/** 10 MB — enforced server-side and mirrored as the client-side hint. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Runtime storage directory for uploaded files (demo backend). Lives under
 * `/db/`, which is gitignored: uploads are runtime data, not repo content. */
export const UPLOAD_DIR = path.join(process.cwd(), "db", "uploads");

/** Extension → canonical content type. Also the upload allowlist. */
export const FILE_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
};

/** Accept-list mirrors of FILE_CONTENT_TYPES for the file inputs. */
export const FILE_ACCEPT = Object.keys(FILE_CONTENT_TYPES)
  .map((ext) => `.${ext}`)
  .join(",");
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Resolves the allowlisted extension for an upload from its client name, or
 * its MIME type as a fallback for extension-less names. */
export function allowlistedExtension(name: string, mime: string): string | null {
  const fromName = name.includes(".")
    ? (name.split(".").pop() ?? "").toLowerCase()
    : "";
  if (fromName && FILE_CONTENT_TYPES[fromName]) return fromName;
  for (const [ext, type] of Object.entries(FILE_CONTENT_TYPES)) {
    if (type === mime) return ext;
  }
  return null;
}

/** Only keys produced by this server are ever readable: a UUIDv4 followed by
 * one allowlisted extension. No separators, no "..", no traversal. */
export function isValidFileKey(key: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.[a-z0-9]{1,8}$/.test(
    key,
  );
}
