"use client";

// Atomic piece of the capture dialog (split out of quick-capture.tsx, step
// 45): the 5-type selector row. DOM is byte-identical to the pre-split
// markup — the S2/B6/N10 runbooks assert on these chips (aria-pressed).

import {
  File,
  Image as ImageIcon,
  Link2,
  Type as TypeIcon,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { TYPE_META } from "@/components/app/meta";
import { useI18n } from "@/lib/i18n";
import { NOTE_TYPES, type NoteType } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<NoteType, LucideIcon> = {
  text: TypeIcon,
  link: Link2,
  image: ImageIcon,
  video: Video,
  file: File,
};

export function CaptureTypeSelector({
  value,
  onChange,
}: {
  value: NoteType;
  onChange: (type: NoteType) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-1.5">
      <Label>{t("capture.typeLabel")}</Label>
      <div className="grid grid-cols-5 gap-1.5">
        {NOTE_TYPES.map((type) => {
          const meta = TYPE_META[type];
          const Icon = TYPE_ICONS[type];
          const active = value === type;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(type)}
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
  );
}
