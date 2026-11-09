"use client";

// Atomic piece of the capture dialog (split out of quick-capture.tsx, step
// 45): the N10 duplicate banner — INFORMATIONAL ONLY (never disables saving,
// never blocks capture; owner rule «ثبت دوباره همچنان آزاد است»). DOM is
// byte-identical to the pre-split markup (verify-n10.sh assertions).

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localizedCategoryName } from "@/components/app/meta";
import { useI18n } from "@/lib/i18n";
import type { CategoryRef } from "@/lib/domain/types";

interface DuplicateBannerProps {
  duplicate: { id: string; category: CategoryRef | null } | null;
  onView: (id: string) => void;
}

export function DuplicateBanner({ duplicate, onView }: DuplicateBannerProps) {
  const { t, locale } = useI18n();
  if (!duplicate) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5"
    >
      <Copy
        className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium leading-5">
          {duplicate.category
            ? t("capture.duplicateFound", {
                category: localizedCategoryName(duplicate.category, locale),
              })
            : t("capture.duplicateFoundNoCategory")}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t("capture.duplicateHint")}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 shrink-0 self-center px-2.5 text-xs"
        onClick={() => onView(duplicate.id)}
      >
        {t("capture.duplicateView")}
      </Button>
    </div>
  );
}
