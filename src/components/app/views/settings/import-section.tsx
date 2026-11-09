"use client";

// Settings — Import card (split out of settings-view.tsx at step 45): the N2
// two-step JSON import guardrail (validate → preview → explicit merge), byte-
// identical to the pre-split markup.

import { useRef, useState } from "react";
import { AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImportData } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import {
  importNoteSchema,
  importNoteTagNames,
  importPayloadSchema,
} from "@/lib/domain/import-schema";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

/** N2 — client-side file cap (mirrors the P3 upload pattern): causal error
 * before any parse attempt. The server keeps its own 20 MB body cap. */
export const MAX_IMPORT_FILE_BYTES = 15 * 1024 * 1024;

interface ImportPreview {
  payload: Record<string, unknown>;
  notes: number;
  categories: number;
  tags: number;
  fileName: string;
}

export function ImportSection() {
  const { t, locale } = useI18n();
  const importMutation = useImportData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const reset = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importErrorText = (code: string): string => {
    switch (code) {
      case "import.too-large":
        return t("settings.import.fileTooLarge");
      case "import.invalid-json":
        return t("settings.import.invalidJson");
      case "import.not-a-savedbox-export":
        return t("settings.import.notSavedbox");
      case "import.invalid-schema":
        return t("settings.import.invalidSchema");
      default:
        return t("settings.import.failed");
    }
  };

  // Step 1 of the two-step guardrail: validate locally, then show the
  // preview. Nothing is sent to the backend before an explicit confirm.
  const onFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      toast.error(t("settings.import.fileTooLarge"));
      reset();
      return;
    }
    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      toast.error(t("settings.import.invalidJson"));
      reset();
      return;
    }
    const parsed = importPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message;
      toast.error(
        message === "not-a-savedbox-export"
          ? t("settings.import.notSavedbox")
          : t("settings.import.invalidSchema"),
      );
      reset();
      return;
    }
    const data = parsed.data;
    // Detected tag names = payload tag list ∪ every note's tag names.
    const tagNames = new Set<string>();
    for (const raw of data.tags ?? []) {
      const name = (raw as { name?: unknown })?.name;
      if (typeof name === "string" && name.trim()) tagNames.add(name.trim());
    }
    for (const raw of data.notes) {
      const parsedNote = importNoteSchema.safeParse(raw);
      if (!parsedNote.success) continue;
      for (const name of importNoteTagNames(parsedNote.data.tags)) {
        tagNames.add(name);
      }
    }
    setPreview({
      payload: payload as Record<string, unknown>,
      notes: data.notes.length,
      categories: data.categories?.length ?? 0,
      tags: tagNames.size,
      fileName: file.name,
    });
  };

  // Step 2: the explicit merge confirm.
  const confirmImport = async () => {
    if (!preview) return;
    try {
      const report = await importMutation.mutateAsync(preview.payload);
      toast.success(
        t("settings.import.done", {
          added: formatNumber(report.notesAdded, locale),
          skipped: formatNumber(report.notesSkippedDuplicates, locale),
          invalid: formatNumber(report.notesSkippedInvalid, locale),
          categories: formatNumber(report.categoriesAdded, locale),
          tags: formatNumber(report.tagsAdded, locale),
        }),
      );
      reset();
    } catch (error) {
      const code = error instanceof ApiError ? error.message : "";
      toast.error(importErrorText(code));
    }
  };

  return (
    <div className="rounded-lg border p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label={t("settings.import.choose")}
        onChange={(event) => void onFileChange(event.target.files?.[0])}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Upload className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("settings.import")}
          </p>
          <p className="text-xs text-muted-foreground">{t("settings.import.desc")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={importMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("settings.import.choose")}
        </Button>
      </div>

      {preview ? (
        <div className="mt-3 space-y-2.5 rounded-lg border bg-muted/40 p-3" role="region" aria-live="polite">
          <p className="flex items-start gap-1.5 text-xs font-medium" dir="auto">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            <span className="break-all">{preview.fileName}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t("settings.import.preview", {
              notes: formatNumber(preview.notes, locale),
              categories: formatNumber(preview.categories, locale),
              tags: formatNumber(preview.tags, locale),
            })}
          </p>
          <p className="text-xs text-muted-foreground">{t("settings.import.mergeHint")}</p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={reset} disabled={importMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => void confirmImport()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending
                ? t("settings.import.importing")
                : t("settings.import.confirm")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
