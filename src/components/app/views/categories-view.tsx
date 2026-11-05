"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EmptyState,
  ErrorState,
} from "@/components/app/states";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  iconByName,
  localizedCategoryName,
} from "@/components/app/meta";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateCategory,
} from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/lib/domain/types";

interface CategoryFormState {
  open: boolean;
  editing: CategoryDTO | null;
}

function CategoryDialog({
  state,
  onClose,
}: {
  state: CategoryFormState;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState(state.editing?.name ?? "");
  const [nameFa, setNameFa] = useState(state.editing?.nameFa ?? "");
  const [icon, setIcon] = useState(state.editing?.icon ?? "folder");
  const [color, setColor] = useState(state.editing?.color ?? CATEGORY_COLORS[0]);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setPending(true);
    try {
      const payload = { name: name.trim(), nameFa: nameFa.trim() || null, icon, color };
      if (state.editing) {
        await updateCategory.mutateAsync({ id: state.editing.id, patch: payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      toast.success(t("categories.saved"));
      onClose();
    } catch {
      toast.error(t("toast.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {state.editing ? t("categories.edit") : t("categories.new")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">{t("categories.name")}</Label>
            <Input
              id="category-name"
              dir="ltr"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("categories.namePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-name-fa">{t("categories.nameFa")}</Label>
            <Input
              id="category-name-fa"
              value={nameFa}
              onChange={(event) => setNameFa(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("categories.icon")}</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_ICONS.map((entry) => {
                const Icon = entry.icon;
                const selected = icon === entry.name;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    aria-pressed={selected}
                    title={entry.name}
                    onClick={() => setIcon(entry.name)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg border transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("categories.color")}</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={color === option}
                  aria-label={option}
                  onClick={() => setColor(option)}
                  className={cn(
                    "size-7 rounded-full transition-transform",
                    color === option
                      ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "hover:scale-105",
                  )}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || !name.trim()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesTab() {
  const { t, locale } = useI18n();
  const categoriesQuery = useCategories();
  const deleteCategory = useDeleteCategory();
  const setFilters = useAppStore((state) => state.setFilters);
  const setView = useAppStore((state) => state.setView);
  const [formState, setFormState] = useState<CategoryFormState>({
    open: false,
    editing: null,
  });
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  const categories = categoriesQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("library.resultsCount", {
            n: formatNumber(categories.length, locale),
          })}
        </p>
        <Button size="sm" className="h-9 gap-1.5" onClick={() => setFormState({ open: true, editing: null })}>
          <Plus className="size-4" aria-hidden="true" />
          {t("categories.new")}
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      ) : categoriesQuery.isError ? (
        <ErrorState onRetry={() => categoriesQuery.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title={t("categories.empty.title")}
          description={t("categories.empty.desc")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const Icon = iconByName(category.icon);
            return (
              <Card
                key={category.id}
                role="button"
                tabIndex={0}
                aria-label={`${t("a11y.openCategory")}: ${localizedCategoryName(category, locale)}`}
                onClick={() => {
                  // Same affordance as dashboard tiles: click = filter library (QE3).
                  setFilters({ categoryId: category.id });
                  setView("library");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFilters({ categoryId: category.id });
                    setView("library");
                  }
                }}
                className="cursor-pointer shadow-xs transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${category.color}1f`, color: category.color }}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {localizedCategoryName(category, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("categories.count", {
                        n: formatNumber(category.noteCount, locale),
                      })}
                      {locale === "fa" && category.name
                        ? ` · ${category.name}`
                        : locale === "en" && category.nameFa
                          ? ` · ${category.nameFa}`
                          : ""}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={t("common.edit")}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setFormState({ open: true, editing: category })}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleting(category)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {formState.open ? (
        <CategoryDialog
          state={formState}
          onClose={() => setFormState({ open: false, editing: null })}
        />
      ) : null}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("categories.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("categories.delete.desc", {
                name: deleting ? localizedCategoryName(deleting, locale) : "",
                n: formatNumber(deleting?.noteCount ?? 0, locale),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteCategory.mutateAsync(deleting.id);
                  toast.success(t("categories.deleted"));
                } catch {
                  toast.error(t("toast.error"));
                } finally {
                  setDeleting(null);
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TagsTab() {
  const { t, locale } = useI18n();
  const tagsQuery = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const setFilters = useAppStore((state) => state.setFilters);
  const setView = useAppStore((state) => state.setView);

  const [name, setName] = useState("");
  const [deleting, setDeleting] = useState<{ id: string; name: string; count: number } | null>(
    null,
  );

  const tags = tagsQuery.data?.items ?? [];

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createTag.mutateAsync({ name: trimmed });
      toast.success(t("tags.saved"));
      setName("");
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("tags.placeholder")}
          onKeyDown={(event) => {
            if (event.key === "Enter") add();
          }}
        />
        <Button onClick={add} disabled={!name.trim() || createTag.isPending} className="shrink-0">
          {t("common.add")}
        </Button>
      </div>

      {tagsQuery.isLoading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-7 w-24 rounded-full bg-muted" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          {t("tags.empty")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="gap-1.5 rounded-full py-1 ps-3 pe-1.5 text-xs"
            >
              <button
                type="button"
                className="hover:text-primary"
                onClick={() => {
                  setFilters({ tagIds: [tag.id] });
                  setView("library");
                }}
              >
                {tag.name}
                <span className="ms-1 text-[10px] text-muted-foreground">
                  {formatNumber(tag.noteCount, locale)}
                </span>
              </button>
              <button
                type="button"
                aria-label={t("common.delete")}
                onClick={() =>
                  setDeleting({ id: tag.id, name: tag.name, count: tag.noteCount })
                }
                className="flex size-5 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tags.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tags.delete.desc", {
                name: deleting?.name ?? "",
                n: formatNumber(deleting?.count ?? 0, locale),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                try {
                  await deleteTag.mutateAsync(deleting.id);
                  toast.success(t("tags.deleted"));
                } catch {
                  toast.error(t("toast.error"));
                } finally {
                  setDeleting(null);
                }
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function CategoriesView() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold sm:text-xl">{t("categories.title")}</h1>
      <Tabs defaultValue="categories">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="categories" className="flex-1 sm:flex-none">
            {t("categories.tab.categories")}
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex-1 sm:flex-none">
            {t("categories.tab.tags")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="tags" className="mt-4">
          <TagsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
