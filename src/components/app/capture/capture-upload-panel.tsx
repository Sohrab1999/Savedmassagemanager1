"use client";

// Atomic piece of the capture dialog (split out of quick-capture.tsx, step
// 45): the P3 real-upload panel for file/image notes. Presentational only —
// the picker handler and clear action arrive as props; the DOM is identical
// to the pre-split markup (upload label, aria-labels, constraints line).

import { FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { formatBytes } from "@/lib/format";
import type { I18nKey } from "@/lib/i18n/dictionaries";
import {
  FILE_ACCEPT,
  IMAGE_ACCEPT,
  type UploadPickHandler,
} from "@/components/app/capture/form-state";
import { cn } from "@/lib/utils";

interface UploadPanelProps {
  noteType: "file" | "image";
  uploading: boolean;
  uploadError: I18nKey | null;
  file: { name: string; size: number | null; url: string } | null;
  onPick: UploadPickHandler;
  onClear: () => void;
}

export function CaptureUploadPanel({
  noteType,
  uploading,
  uploadError,
  file,
  onPick,
  onClear,
}: UploadPanelProps) {
  const { t, locale } = useI18n();

  return (
    <div className="space-y-1.5">
      <Label>
        {noteType === "image"
          ? t("capture.imageFileLabel")
          : t("capture.fileLabel")}
      </Label>
      {file ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-2">
          {noteType === "image" && file.url ? (
            <img
              src={file.url}
              alt={file.name}
              className="size-10 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
              <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {file.size ? formatBytes(file.size, locale) : null}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClear}
            aria-label={t("capture.removeFile")}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label
          className={cn(
            "flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-3 text-center transition-colors hover:bg-accent",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="text-xs font-medium">
            {uploading ? t("capture.uploading") : t("capture.chooseFile")}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t("capture.fileConstraints")}
          </span>
          <input
            type="file"
            className="sr-only"
            accept={noteType === "image" ? IMAGE_ACCEPT : FILE_ACCEPT}
            onChange={(event) => void onPick(event)}
            disabled={uploading}
            aria-label={
              noteType === "image"
                ? t("capture.imageFileLabel")
                : t("capture.fileLabel")
            }
          />
        </label>
      )}
      {uploadError ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {t(uploadError)}
        </p>
      ) : null}
    </div>
  );
}
