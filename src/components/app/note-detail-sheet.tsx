"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  ExternalLink,
  File as FileIcon,
  Link2,
  MessageSquareQuote,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator as SeparatorUi } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { TYPE_META, iconByName, localizedCategoryName } from "@/components/app/meta";
import { TagChipsInput } from "@/components/app/tag-chips-input";
import {
  useNote,
  useCategories,
  useTags,
  useUpdateNote,
  useDeleteNote,
  useRestoreNote,
} from "@/hooks/queries";
import { recordDeletion, recordUndo } from "@/lib/undo-metrics";
import { RelatedNotes } from "@/components/app/related-notes";
import { showUndoToast } from "@/components/app/undo-toast";
import { useI18n } from "@/lib/i18n";
import { domainOf, formatBytes, formatDateTime, formatDuration } from "@/lib/format";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function TypeBadge({ type }: { type: string }) {
  const { t } = useI18n();
  const meta = TYPE_META[type as keyof typeof TYPE_META] ?? TYPE_META.text;
  const Icon = meta.icon;
  return (
    <Badge
      variant="secondary"
      className="gap-1 rounded-full"
      style={{ color: meta.color }}
    >
      <Icon className="size-3" aria-hidden="true" />
      {t(meta.labelKey)}
    </Badge>
  );
}

function MediaPreview({ noteId }: { noteId: string }) {
  const noteQuery = useNote(noteId);
  const { t, locale } = useI18n();
  const note = noteQuery.data;
  if (!note) return null;

  if (note.type === "image" && note.mediaUrl) {
    return (
      <img
        src={note.mediaUrl}
        alt={note.title}
        className="max-h-72 w-full rounded-xl border object-cover"
      />
    );
  }

  if (note.type === "video") {
    return (
      <div className="relative overflow-hidden rounded-xl border">
        {note.mediaUrl ? (
          <img
            src={note.mediaUrl}
            alt={note.title}
            className="max-h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-accent">
            <MessageSquareQuote className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        {note.mediaDuration ? (
          <span className="absolute top-2 end-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white" dir="ltr">
            {formatDuration(note.mediaDuration)}
          </span>
        ) : null}
      </div>
    );
  }

  if (note.type === "link" && note.url) {
    return (
      <a
        href={note.url}
        target="_blank"
        rel="noreferrer noopener"
        dir="ltr"
        className="flex items-center gap-3 rounded-xl border bg-accent/50 p-3 transition-colors hover:bg-accent"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
          <Link2 className="size-4 text-primary" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-primary">
            {domainOf(note.url)}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {note.url}
          </span>
        </span>
        <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </a>
    );
  }

  if (note.type === "file") {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-accent/50 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
          <FileIcon className="size-5" style={{ color: TYPE_META.file.color }} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" dir="ltr">
            {note.fileName ?? note.title}
          </span>
          {note.fileSize ? (
            <span className="block text-xs text-muted-foreground">
              {formatBytes(note.fileSize, locale)}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  // text
  if (note.content) {
    return (
      <div className="space-y-1.5 rounded-xl bg-secondary p-3.5">
        {note.sourceChat ? (
          <p className="text-[11px] font-medium text-secondary-foreground/70">
            {note.sourceChat}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-6 text-secondary-foreground">
          {note.content}
        </p>
      </div>
    );
  }
  return null;
}

export function NoteDetailSheet() {
  const { t, locale } = useI18n();
  const detailNoteId = useAppStore((state) => state.detailNoteId);
  // UX-B6 — organize-bridge intent: the capture-success toast CTA opens the
  // sheet straight INTO the explicit edit session (categorize the new item).
  // The flag lives in the store only for this one transition; every regular
  // open still lands in the B2 view-first mode.
  const detailAutoEdit = useAppStore((state) => state.detailAutoEdit);
  const closeNote = useAppStore((state) => state.closeNote);
  const noteQuery = useNote(detailNoteId);
  const categoriesQuery = useCategories();
  const tagsQuery = useTags();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const restoreNote = useRestoreNote();

  const note = noteQuery.data;
  const categories = categoriesQuery.data?.items ?? [];
  const allTags = tagsQuery.data?.items ?? [];
  // UX-B2 — resolved once for the view-mode chip.
  const viewCategory =
    note && note.categoryId
      ? categories.find((category) => category.id === note.categoryId)
      : undefined;

  const [confirmDelete, setConfirmDelete] = useState(false);
  // UX-B2 (T-2) — the WHOLE sheet is view-first: title/content AND
  // category/tags/description share ONE explicit edit session with a single
  // save/cancel contract. Nothing is editable in view mode (no accidental
  // edits); «ویرایش» is the only entry.
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("none");
  const [editTagNames, setEditTagNames] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState("");

  // Reset the edit forms whenever a different note is opened (render-phase
  // state adjustment, per React docs) — and always land in VIEW mode, EXCEPT
  // the UX-B6 organize bridge (toast CTA) which explicitly requests edit.
  const [lastNoteId, setLastNoteId] = useState<string | null>(null);
  if (note && note.id !== lastNoteId) {
    setLastNoteId(note.id);
    setEditing(detailAutoEdit);
    setEditTitle(note.title);
    setEditContent(note.content ?? "");
    setEditCategoryId(note.categoryId ?? "none");
    setEditTagNames(note.tags.map((tag) => tag.name));
    setEditDescription(note.description ?? "");
  }

  const patchNote = async (patch: Parameters<typeof updateNote.mutateAsync>[0]["patch"]) => {
    if (!note) return;
    try {
      await updateNote.mutateAsync({ id: note.id, patch });
      return true;
    } catch {
      toast.error(t("toast.error"));
      return false;
    }
  };

  // S2 — ONE tag-entry UX shared with quick capture. In the B2 edit session
  // the chip input is LOCAL state; the change is committed only by «ذخیره».

  const copyContent = async () => {
    if (!note) return;
    const text = note.content ?? note.url ?? "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  // S4 + UX-B2 — ONE save for the whole edit session: title (+ content for
  // text-bearing notes) AND category AND tags AND description.
  const canEditContent = note?.type === "text" || note?.content !== null;
  const enterEdit = () => {
    if (!note) return;
    setEditTitle(note.title);
    setEditContent(note.content ?? "");
    setEditCategoryId(note.categoryId ?? "none");
    setEditTagNames(note.tags.map((tag) => tag.name));
    setEditDescription(note.description ?? "");
    setEditing(true);
  };
  const cancelEdit = () => {
    if (!note) return;
    setEditTitle(note.title);
    setEditContent(note.content ?? "");
    setEditCategoryId(note.categoryId ?? "none");
    setEditTagNames(note.tags.map((tag) => tag.name));
    setEditDescription(note.description ?? "");
    setEditing(false);
  };
  const saveEdit = async () => {
    if (!note) return;
    const title = editTitle.trim();
    if (!title) return;
    const patch: Parameters<typeof updateNote.mutateAsync>[0]["patch"] = {
      title,
      categoryId: editCategoryId === "none" ? null : editCategoryId,
      tagNames: editTagNames,
      description: editDescription.trim() || null,
    };
    if (canEditContent) {
      const content = editContent.trim();
      patch.content = content || null;
    }
    const ok = await patchNote(patch);
    if (ok) {
      setEditing(false);
      toast.success(t("note.detail.changesSaved"));
    }
  };

  // S5 — undo: pulls the note out of the trash (7-day window; the KPI
  // counter records every undo).
  const restoreFromTrash = async (id: string) => {
    try {
      await restoreNote.mutateAsync(id);
      recordUndo();
      toast.success(t("note.detail.restored"));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const isLoadingSheet = detailNoteId !== null && noteQuery.isLoading;

  return (
    <Sheet open={detailNoteId !== null} onOpenChange={(open) => !open && closeNote()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-md scroll-area"
        aria-describedby={undefined}
      >
        {/* Always-mounted accessible title (visible title renders with content) */}
        <SheetTitle className="sr-only">
          {note?.title ?? t("app.name")}
        </SheetTitle>

        {isLoadingSheet ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !note ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {t("toast.error")}
          </div>
        ) : (
          <div className="flex min-h-full flex-col gap-4 p-4 pb-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={note.type} />
                <span className="ms-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-pressed={note.isFavorite}
                    aria-label={t("note.detail.favorite")}
                    title={t("note.detail.favorite")}
                    onClick={() => patchNote({ isFavorite: !note.isFavorite })}
                  >
                    <Star
                      className={cn(
                        "size-4",
                        note.isFavorite && "fill-amber-400 text-amber-500",
                      )}
                      aria-hidden="true"
                    />
                  </Button>
              {editing ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label={t("common.cancel")}
                  title={t("common.cancel")}
                  onClick={cancelEdit}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  aria-label={t("common.edit")}
                  title={t("common.edit")}
                  onClick={enterEdit}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
              )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={note.isArchived ? t("note.detail.unarchive") : t("note.detail.archive")}
                    title={note.isArchived ? t("note.detail.unarchive") : t("note.detail.archive")}
                    onClick={() => patchNote({ isArchived: !note.isArchived })}
                  >
                    {note.isArchived ? (
                      <ArchiveRestore className="size-4" aria-hidden="true" />
                    ) : (
                      <Archive className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </span>
              </div>
              {editing ? (
                <div className="space-y-2">
                  {/* UX-B2 — explicit edit-mode cue (DoD: no accidental edits) */}
                  <p
                    role="status"
                    className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
                  >
                    {t("note.detail.editHint")}
                  </p>
                  <Input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    aria-label={t("capture.titleLabel")}
                    placeholder={t("capture.titlePlaceholder")}
                    autoFocus
                    maxLength={200}
                  />
                  {canEditContent ? (
                    <Textarea
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      aria-label={t("capture.contentLabel")}
                      placeholder={t("capture.contentPlaceholder")}
                      rows={5}
                    />
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={!editTitle.trim()}
                      title={!editTitle.trim() ? t("capture.titleRequired") : undefined}
                      onClick={saveEdit}
                    >
                      <Check className="size-4" aria-hidden="true" />
                      {t("common.save")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={cancelEdit}
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <h2 className="text-base font-bold leading-7">{note.title}</h2>
              )}
            </div>

            {/* While editing a text note, the content is in the editor above —
                hiding the read-only duplicate. */}
            {!(editing && note.type === "text") ? (
              <MediaPreview noteId={note.id} />
            ) : null}

            {/* Meta rows */}
            <div className="space-y-2 rounded-xl border p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{t("note.detail.source")}</span>
                <span className="font-medium">
                  {note.sourceChat ?? t("note.detail.manual")}
                </span>
              </div>
              <SeparatorUi />
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{t("note.detail.savedAt")}</span>
                <span className="font-medium">
                  {formatDateTime(note.savedAt, locale)}
                </span>
              </div>
            </div>

            {/* UX-B2 (T-2) — view-first: category/tags/description render
                READ-ONLY in view mode; they become editable ONLY inside the
                explicit edit session above (one save/cancel contract). */}
            {/* Category */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.category")}
              </p>
              {editing ? (
                <Select
                  value={editCategoryId}
                  onValueChange={setEditCategoryId}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={t("note.detail.category")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("note.detail.uncategorized")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {localizedCategoryName(category, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : viewCategory ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-accent/40 px-2.5 py-1 text-xs font-medium">
                  {(() => {
                    const Icon = iconByName(viewCategory.icon);
                    return Icon ? (
                      <Icon className="size-3.5" aria-hidden="true" />
                    ) : null;
                  })()}
                  {localizedCategoryName(viewCategory, locale)}
                </span>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("note.detail.uncategorized")}
                </p>
              )}
            </div>

            {/* Tags — S2 shared chip input (edit mode only; view = read-only chips) */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.tags")}
              </p>
              {editing ? (
                <TagChipsInput
                  tags={editTagNames}
                  onChange={setEditTagNames}
                  suggestions={allTags.map((tag) => ({
                    name: tag.name,
                    noteCount: tag.noteCount,
                  }))}
                  ariaLabel={t("note.detail.tags")}
                />
              ) : note.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="rounded-full"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("note.detail.noTags")}
                </p>
              )}
            </div>

            {/* Description (edit mode only; view = read-only paragraph) */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.description")}
              </p>
              {editing ? (
                <Textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  placeholder={t("note.detail.descriptionPlaceholder")}
                  aria-label={t("note.detail.description")}
                  rows={3}
                />
              ) : note.description ? (
                <p className="whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm leading-6 text-secondary-foreground">
                  {note.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("note.detail.noDescription")}
                </p>
              )}
            </div>

            {/* N6 — related notes: deterministic co-occurrence, NO AI; the
                section only renders when a genuine shared tag/category
                exists (single-item library stays clean). Hidden during the
                edit session (B2). */}
            {!editing ? <RelatedNotes currentId={note.id} /> : null}

            {/* Actions (view mode only — the edit session has save/cancel) */}
            {!editing ? (
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              {note.content || note.url ? (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={copyContent}>
                  <Copy className="size-4" aria-hidden="true" />
                  {t("note.detail.copyContent")}
                </Button>
              ) : null}
              {note.url ? (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={note.url} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="size-4" aria-hidden="true" />
                    {t("note.detail.openOriginal")}
                  </a>
                </Button>
              ) : null}
              {note.deletedAt ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="ms-auto gap-1.5 border-primary/50 text-primary hover:bg-primary/10"
                  disabled={restoreNote.isPending}
                  onClick={() => restoreFromTrash(note.id)}
                >
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  {t("note.detail.restore")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="ms-auto gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("note.detail.delete")}
                </Button>
              )}
            </div>
            ) : null}
          </div>
        )}
      </SheetContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("note.detail.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("note.detail.delete.desc", { name: note?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!note) return;
                const trashedId = note.id;
                try {
                  await deleteNote.mutateAsync(trashedId);
                  recordDeletion();
                  closeNote();
                  // S5 + UX-A6 — the stabilized undo toast: assertive live
                  // region, fixed anchor, ≥ 8-second window, 44px undo
                  // button (sonner was polite-only + a moving anchor). The
                  // KPI wiring stays untouched (P6).
                  showUndoToast({
                    message: t("toast.noteTrashed"),
                    undoLabel: t("common.restore"),
                    onUndo: () => void restoreFromTrash(trashedId),
                  });
                } catch {
                  toast.error(t("toast.error"));
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
