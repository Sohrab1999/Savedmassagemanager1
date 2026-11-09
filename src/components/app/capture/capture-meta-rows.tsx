"use client";

// Atomic piece of the capture dialog (split out of quick-capture.tsx, step
// 45): the category select + tag chips row. Presentational — data via props.

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagChipsInput } from "@/components/app/tag-chips-input";
import { localizedCategoryName } from "@/components/app/meta";
import { useI18n } from "@/lib/i18n";
import type { CategoryDTO } from "@/lib/domain/types";

interface CaptureMetaRowsProps {
  categories: CategoryDTO[];
  tagSuggestions: { name: string; noteCount: number }[];
  categoryId: string;
  tags: string[];
  onCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export function CaptureMetaRows({
  categories,
  tagSuggestions,
  categoryId,
  tags,
  onCategoryChange,
  onTagsChange,
}: CaptureMetaRowsProps) {
  const { t, locale } = useI18n();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{t("capture.categoryLabel")}</Label>
        <Select value={categoryId} onValueChange={onCategoryChange}>
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
        <TagChipsInput
          id="capture-tags"
          tags={tags}
          onChange={onTagsChange}
          suggestions={tagSuggestions}
          ariaLabel={t("capture.tagsLabel")}
        />
      </div>
    </div>
  );
}
