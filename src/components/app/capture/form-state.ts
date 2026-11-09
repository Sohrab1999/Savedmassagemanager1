// Capture form MODEL — split out of quick-capture.tsx at step 45 (owner rule:
// atomic state models, files ≤150–200 lines). The dialog's field components
// and the orchestrator both import from here.

import type { ChangeEvent } from "react";
import type { NoteType } from "@/lib/domain/types";
import type { I18nKey } from "@/lib/i18n/dictionaries";
import { ApiError } from "@/lib/api/client";

export interface CaptureFormState {
  type: NoteType;
  title: string;
  content: string;
  url: string;
  mediaUrl: string;
  fileName: string | null;
  fileSize: number | null;
  categoryId: string;
  tags: string[];
}

export const emptyCaptureForm: CaptureFormState = {
  type: "text",
  title: "",
  content: "",
  url: "",
  mediaUrl: "",
  fileName: null,
  fileSize: null,
  categoryId: "none",
  tags: [],
};

// P3 — client mirrors of the server upload rules (src/server/storage.ts is
// the enforcement boundary; these only shape the file picker + fast errors).
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const FILE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.md,.csv";
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function uploadErrorMessage(error: unknown): I18nKey {
  if (error instanceof ApiError) {
    if (error.message === "file-too-large") return "capture.fileTooLarge";
    if (error.message === "unsupported-type") return "capture.fileTypeUnsupported";
  }
  return "capture.uploadFailed";
}

export type UploadPickHandler = (
  event: ChangeEvent<HTMLInputElement>,
) => void | Promise<void>;
