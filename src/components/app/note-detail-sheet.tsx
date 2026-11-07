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
import { TYPE_META, localizedCategoryName } from "@/components/app/meta";
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

  const [description, setDescription] = useState("");
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // S4 — title/content editor state (edit → save/cancel in the sheet).
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Reset the description/edit forms whenever a different note is opened
  // (render-phase state adjustment, per React docs).
  const [lastNoteId, setLastNoteId] = useState<string | null>(null);
  if (note && note.id !== lastNoteId) {
    setLastNoteId(note.id);
    setDescription(note.description ?? "");
    setDescriptionDirty(false);
    setEditing(false);
    setEditTitle(note.title);
    setEditContent(note.content ?? "");
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

  // S2 — ONE tag-entry UX shared with quick capture: the shared chip input
  // hands us the full new name list; a single updateNote patch applies it.
  // Both demo (Prisma connectOrCreate) and cloud (resolveTagRefs) create
  // missing tags from tagNames, so no pre-creation step is needed here.
  const handleTagsChange = (names: string[]) => {
    void patchNote({ tagNames: names });
  };

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

  // S4 — save the edited title (and content for text-bearing notes).
  const canEditContent = note?.type === "text" || note?.content !== null;
  const saveEdit = async () => {
    if (!note) return;
    const title = editTitle.trim();
    if (!title) return;
    const patch: Parameters<typeof updateNote.mutateAsync>[0]["patch"] = {
      title,
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
                  onClick={() => {
                    setEditing(false);
                    setEditTitle(note.title);
                    setEditContent(note.content ?? "");
                  }}
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
                  onClick={() => {
                    setEditTitle(note.title);
                    setEditContent(note.content ?? "");
                    setEditing(true);
                  }}
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
                      onClick={() => {
                        setEditing(false);
                        setEditTitle(note.title);
                        setEditContent(note.content ?? "");
                      }}
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

            {/* Category */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.category")}
              </p>
              <Select
                value={note.categoryId ?? "none"}
                onValueChange={(value) =>
                  patchNote({ categoryId: value === "none" ? null : value })
                }
              >
                <SelectTrigger className="w-full" aria-label={t("note.detail.category")}>
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
            </div>

            {/* Tags — S2 shared chip input (same UX as quick capture) */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.tags")}
              </p>
              <TagChipsInput
                tags={note.tags.map((tag) => tag.name)}
                onChange={handleTagsChange}
                suggestions={allTags.map((tag) => tag.name)}
                ariaLabel={t("note.detail.tags")}
              />
            </div>

            {/* Editable description */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.description")}
              </p>
              <Textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setDescriptionDirty(true);
                }}
                placeholder={t("note.detail.descriptionPlaceholder")}
                rows={3}
              />
              {descriptionDirty ? (
                <Button
                  size="sm"
                  className="h-8"
                  onClick={async () => {
                    const ok = await patchNote({ description: description.trim() || null });
                    if (ok) {
                      setDescriptionDirty(false);
                      toast.success(t("note.detail.descriptionSaved"));
                    }
                  }}
                >
                  <Check className="size-4" aria-hidden="true" />
                  {t("note.detail.saveDescription")}
                </Button>
              ) : null}
            </div>

            {/* Actions */}
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
                  // S5 — success toast with the 7-second «بازگردانی» window.
                  toast.success(t("toast.noteTrashed"), {
                    duration: 7000,
                    action: {
                      label: t("common.restore"),
                      onClick: () => void restoreFromTrash(trashedId),
                    },
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
