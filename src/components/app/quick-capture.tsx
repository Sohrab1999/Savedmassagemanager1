"use client";

// QuickCapture — the ONE capture dialog (S2 paste-link, P3 upload, N10
// soft-duplicate banner, QE6 causal save hint, UX-B6 organize bridge, and
// since step 45 the F1/F2 external-channel prefill + the F5 URL suggestion).
// Render-only orchestrator: every piece of state/logic lives in
// `useCaptureForm` (+ atomic rows/banners under `components/app/capture/`).

import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CaptureTypeSelector } from "@/components/app/capture/capture-type-selector";
import { CaptureFieldRows } from "@/components/app/capture/capture-field-rows";
import { CaptureMetaRows } from "@/components/app/capture/capture-meta-rows";
import { CaptureUploadPanel } from "@/components/app/capture/capture-upload-panel";
import { DuplicateBanner } from "@/components/app/capture/duplicate-banner";
import { UrlSuggestBanner } from "@/components/app/capture/url-suggest-banner";
import { useCaptureForm } from "@/components/app/capture/use-capture-form";
import { useCategories, useTags } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/stores/app-store";

export function QuickCapture() {
  const { t } = useI18n();
  const capture = useCaptureForm();
  const openNote = useAppStore((state) => state.openNote);
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();
  const { form, upload } = capture;

  return (
    <Dialog open={capture.open} onOpenChange={capture.setOpen}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("capture.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <CaptureTypeSelector
            value={form.type}
            onChange={(type) => capture.patch({ type })}
          />

          <CaptureFieldRows
            form={form}
            titleHint={capture.titleHint}
            onTitleChange={(value) => capture.patch({ title: value })}
            onTitlePaste={capture.handleTitlePaste}
            onPatch={capture.patch}
          />

          <UrlSuggestBanner
            suggestedUrl={capture.urlSuggest.suggestedUrl}
            onAccept={capture.acceptUrlSuggestion}
            onDismiss={capture.urlSuggest.dismiss}
          />

          <DuplicateBanner
            duplicate={capture.duplicateNote}
            onView={(id) => {
              capture.setOpen(false);
              openNote(id);
            }}
          />

          {form.type === "file" || form.type === "image" ? (
            <CaptureUploadPanel
              noteType={form.type}
              uploading={upload.uploading}
              uploadError={upload.uploadError}
              file={
                form.fileName
                  ? { name: form.fileName, size: form.fileSize, url: form.mediaUrl }
                  : null
              }
              onPick={(event) => void upload.handleFileSelected(event.currentTarget)}
              onClear={upload.clearUploadedFile}
            />
          ) : null}

          <CaptureMetaRows
            categories={categoriesQuery.data?.items ?? []}
            tagSuggestions={
              tagsQuery.data?.items.map((tag) => ({
                name: tag.name,
                noteCount: tag.noteCount,
              })) ?? []
            }
            categoryId={form.categoryId}
            tags={form.tags}
            onCategoryChange={(value) => capture.patch({ categoryId: value })}
            onTagsChange={(tags) => capture.patch({ tags })}
          />

          {capture.error ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {capture.error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => capture.setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => void capture.submit()}
            disabled={capture.pending || upload.uploading || Boolean(capture.saveDisabledReason)}
            title={capture.saveDisabledReason}
            aria-disabled={capture.pending || upload.uploading || Boolean(capture.saveDisabledReason)}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("capture.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
