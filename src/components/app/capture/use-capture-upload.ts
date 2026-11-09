"use client";

// P3 — the real-upload state machine of the capture dialog (split out at
// step 45). Owns: uploading/uploadError state, the pick handler (client
// mirror of the server caps + title-from-file friction reduction, QE6
// spirit) and the clear action. The server (src/server/storage.ts) remains
// the enforcement boundary.

import { useState } from "react";
import {
  MAX_FILE_BYTES,
  uploadErrorMessage,
  type CaptureFormState,
} from "@/components/app/capture/form-state";
import { dataSource } from "@/services/data-source";
import type { I18nKey } from "@/lib/i18n/dictionaries";

type SetForm = (
  updater: (current: CaptureFormState) => CaptureFormState,
) => void;

export function useCaptureUpload(
  form: CaptureFormState,
  setForm: SetForm,
  setTitleFromFile: (value: boolean) => void,
) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<I18nKey | null>(null);

  const reset = () => {
    setUploading(false);
    setUploadError(null);
  };

  // Upload the picked file right away, then store the metadata on the form.
  // An empty title is prefilled from the file name (minus extension).
  const handleFileSelected = async (input: HTMLInputElement | null) => {
    const file = input?.files?.[0];
    if (input) input.value = "";
    if (!file) return;
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      setUploadError("capture.fileTooLarge");
      return;
    }
    setUploadError(null);
    const titleWasEmpty = !form.title.trim();
    setUploading(true);
    try {
      const uploaded = await dataSource.uploadFile(file);
      setForm((current) => ({
        ...current,
        mediaUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        title: titleWasEmpty
          ? uploaded.fileName.replace(/\.[^.]+$/, "")
          : current.title,
      }));
      if (titleWasEmpty) setTitleFromFile(true);
    } catch (uploadFailure) {
      setUploadError(uploadErrorMessage(uploadFailure));
    } finally {
      setUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setForm((current) => ({
      ...current,
      mediaUrl: "",
      fileName: null,
      fileSize: null,
    }));
    setUploadError(null);
  };

  return {
    uploading,
    uploadError,
    handleFileSelected,
    clearUploadedFile,
    reset,
  };
}
