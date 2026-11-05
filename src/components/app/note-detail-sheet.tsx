"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  ExternalLink,
  File as FileIcon,
  Link2,
  MessageSquareQuote,
  Plus,
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
import { TYPE_META, localizedCategoryName } from "@/components/app/meta";
import { useNote, useCategories, useTags, useUpdateNote, useDeleteNote } from "@/hooks/queries";
import { apiRoutes } from "@/lib/api";
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

  const note = noteQuery.data;
  const categories = categoriesQuery.data?.items ?? [];
  const allTags = tagsQuery.data?.items ?? [];

  const [description, setDescription] = useState("");
  const [descriptionDirty, setDescriptionDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagInput, setTagInput] = useState(false);

  // Reset the description form whenever a different note is opened
  // (render-phase state adjustment, per React docs).
  const [lastNoteId, setLastNoteId] = useState<string | null>(null);
  if (note && note.id !== lastNoteId) {
    setLastNoteId(note.id);
    setDescription(note.description ?? "");
    setDescriptionDirty(false);
  }

  const selectedTagIds = useMemo(
    () => note?.tags.map((tag) => tag.id) ?? [],
    [note?.tags],
  );

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

  const addTag = async (name: string) => {
    if (!note) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const existing = allTags.find((tag) => tag.name === trimmed);
      const tag = existing ?? (await apiRoutes.createTag({ name: trimmed }));
      if (selectedTagIds.includes(tag.id)) {
        setTagInput(false);
        return;
      }
      await updateNote.mutateAsync({
        id: note.id,
        patch: { tagNames: [...note.tags.map((item) => item.name), trimmed] },
      });
      setTagInput(false);
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const removeTag = async (tagName: string) => {
    if (!note) return;
    await patchNote({
      tagNames: note.tags.map((tag) => tag.name).filter((name) => name !== tagName),
    });
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
              <h2 className="text-base font-bold leading-7">{note.title}</h2>
            </div>

            <MediaPreview noteId={note.id} />

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

            {/* Tags */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("note.detail.tags")}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {note.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 rounded-full ps-2.5 pe-1"
                  >
                    {tag.name}
                    <button
                      type="button"
                      aria-label={t("common.delete")}
                      onClick={() => removeTag(tag.name)}
                      className="flex size-4 items-center justify-center rounded-full hover:bg-background/60"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
                {tagInput ? (
                  <input
                    autoFocus
                    className="h-7 w-28 rounded-full border bg-background px-2.5 text-xs outline-none focus:border-primary"
                    placeholder={t("note.detail.addTag")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addTag((event.target as HTMLInputElement).value);
                      }
                      if (event.key === "Escape") setTagInput(false);
                    }}
                    onBlur={(event) => {
                      if (event.target.value.trim()) addTag(event.target.value);
                      else setTagInput(false);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setTagInput(true)}
                    className="flex h-7 items-center gap-1 rounded-full border border-dashed px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                    {t("note.detail.addTag")}
                  </button>
                )}
              </div>
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
              <Button
                variant="outline"
                size="sm"
                className="ms-auto gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t("note.detail.delete")}
              </Button>
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
                try {
                  await deleteNote.mutateAsync(note.id);
                  toast.success(t("note.detail.deleted"));
                  closeNote();
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
