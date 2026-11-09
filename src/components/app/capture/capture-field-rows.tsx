"use client";

// Atomic piece of the capture dialog (split out of quick-capture.tsx, step
// 45): title / link-URL / media-URL / content field rows. Presentational —
// the form state and handlers arrive via props (model: form-state.ts). The
// DOM is identical to the pre-split markup (ids capture-title/capture-url/
// capture-content are runbook anchors).

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import type { ClipboardEvent } from "react";
import type { CaptureFormState } from "@/components/app/capture/form-state";

interface CaptureFieldRowsProps {
  form: CaptureFormState;
  /** Under-title status line (QE6 causal reason / link-detected / prefill). */
  titleHint: string | null;
  onTitleChange: (value: string) => void;
  onTitlePaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onPatch: (part: Partial<CaptureFormState>) => void;
}

export function CaptureFieldRows({
  form,
  titleHint,
  onTitleChange,
  onTitlePaste,
  onPatch,
}: CaptureFieldRowsProps) {
  const { t } = useI18n();
  const hasUploadedFile = Boolean(form.fileName && form.mediaUrl);

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="capture-title">{t("capture.titleLabel")}</Label>
        <Input
          id="capture-title"
          value={form.title}
          onChange={(event) => onTitleChange(event.target.value)}
          onPaste={onTitlePaste}
          placeholder={t("capture.titlePlaceholder")}
        />
        <p className="text-[11px] text-muted-foreground" role="status">
          {titleHint ?? t("capture.titleHint")}
        </p>
      </div>

      {form.type === "link" ? (
        <div className="space-y-1.5">
          <Label htmlFor="capture-url" dir="ltr">
            {t("capture.urlLabel")}
          </Label>
          <Input
            id="capture-url"
            dir="ltr"
            type="url"
            value={form.url}
            onChange={(event) => onPatch({ url: event.target.value })}
            placeholder={t("capture.urlPlaceholder")}
          />
        </div>
      ) : null}

      {form.type === "video" || (form.type === "image" && !hasUploadedFile) ? (
        <div className="space-y-1.5">
          <Label htmlFor="capture-media" dir="ltr">
            {t("capture.mediaUrlLabel")}
          </Label>
          <Input
            id="capture-media"
            dir="ltr"
            value={form.mediaUrl}
            onChange={(event) => onPatch({ mediaUrl: event.target.value })}
            placeholder={t("capture.mediaUrlPlaceholder")}
          />
        </div>
      ) : null}

      {form.type === "text" || Boolean(form.content) || form.type === "file" ? (
        <div className="space-y-1.5">
          <Label htmlFor="capture-content">
            {form.type === "text" ? t("capture.contentLabel") : t("capture.contentLabel")}
          </Label>
          <Textarea
            id="capture-content"
            value={form.content}
            onChange={(event) => onPatch({ content: event.target.value })}
            placeholder={t("capture.contentPlaceholder")}
            rows={4}
          />
        </div>
      ) : null}
    </>
  );
}
