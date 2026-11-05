"use client";

import { useState } from "react";
import {
  File,
  Image as ImageIcon,
  Link2,
  Plus,
  Type as TypeIcon,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_META, localizedCategoryName } from "@/components/app/meta";
import { useCategories, useCreateNote } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { NOTE_TYPES, type NoteType } from "@/lib/domain/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FormState {
  type: NoteType;
  title: string;
  content: string;
  url: string;
  mediaUrl: string;
  categoryId: string;
  tagsInput: string;
}

const emptyForm: FormState = {
  type: "text",
  title: "",
  content: "",
  url: "",
  mediaUrl: "",
  categoryId: "none",
  tagsInput: "",
};

const TYPE_ICONS: Record<NoteType, LucideIcon> = {
  text: TypeIcon,
  link: Link2,
  image: ImageIcon,
  video: Video,
  file: File,
};

export function QuickCapture() {
  const { t, locale } = useI18n();
  const open = useAppStore((state) => state.captureOpen);
  const setOpen = useAppStore((state) => state.setCaptureOpen);
  const categoriesQuery = useCategories();
  const createNote = useCreateNote();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  // Reset the form whenever the dialog opens (render-phase state adjustment).
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setForm(emptyForm);
      setError(null);
    }
  }

  const patch = (part: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...part }));

  const submit = async () => {
    if (!form.title.trim()) {
      setError(t("capture.titleRequired"));
      return;
    }
    if (form.type === "text" && !form.content.trim()) {
      setError(t("capture.contentRequired"));
      return;
    }
    if (form.type === "link") {
      const url = form.url.trim();
      if (!url || !/^https?:\/\/.+/i.test(url)) {
        setError(t("capture.urlRequired"));
        return;
      }
    }

    const tagNames = form.tagsInput
      .split(/[,،]/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      await createNote.mutateAsync({
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim() || null,
        url: form.type === "link" ? form.url.trim() : form.url.trim() || null,
        mediaUrl: form.mediaUrl.trim() || null,
        categoryId: form.categoryId === "none" ? null : form.categoryId,
        tagNames,
      });
      toast.success(t("capture.saved"));
      setOpen(false);
    } catch {
      toast.error(t("toast.error"));
    }
  };

  const categories = categoriesQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("capture.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label>{t("capture.typeLabel")}</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {NOTE_TYPES.map((type) => {
                const meta = TYPE_META[type];
                const Icon = TYPE_ICONS[type];
                const active = form.type === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ type })}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border p-2 text-[10px] font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <Icon
                      className="size-4"
                      style={{ color: active ? undefined : meta.color }}
                      aria-hidden="true"
                    />
                    {t(meta.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="capture-title">{t("capture.titleLabel")}</Label>
            <Input
              id="capture-title"
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder={t("capture.titlePlaceholder")}
            />
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
                onChange={(event) => patch({ url: event.target.value })}
                placeholder={t("capture.urlPlaceholder")}
              />
            </div>
          ) : null}

          {(form.type === "image" || form.type === "video") ? (
            <div className="space-y-1.5">
              <Label htmlFor="capture-media" dir="ltr">
                {t("capture.mediaUrlLabel")}
              </Label>
              <Input
                id="capture-media"
                dir="ltr"
                value={form.mediaUrl}
                onChange={(event) => patch({ mediaUrl: event.target.value })}
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
                onChange={(event) => patch({ content: event.target.value })}
                placeholder={t("capture.contentPlaceholder")}
                rows={4}
              />
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("capture.categoryLabel")}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => patch({ categoryId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {localizedCategoryName(category, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capture-tags">{t("capture.tagsLabel")}</Label>
              <Input
                id="capture-tags"
                value={form.tagsInput}
                onChange={(event) => patch({ tagsInput: event.target.value })}
                placeholder={t("capture.tagsPlaceholder")}
              />
            </div>
          </div>

          {error ? (
            <p className="text-xs font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={createNote.isPending || !form.title.trim()}>
            <Plus className="size-4" aria-hidden="true" />
            {t("capture.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
