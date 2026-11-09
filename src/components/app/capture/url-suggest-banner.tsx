"use client";

// F5 (A-3.1) — the soft «this looks like a link» banner inside the capture
// dialog. Atomic UI: state comes from useUrlSuggest via the orchestrator;
// acceptance moves the URL into the link fields, refusal saves as plain text
// (never blocks, never rewrites the user's words — P2/N10/D4).

import { Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface UrlSuggestBannerProps {
  /** Non-null → the banner renders (the orchestrator owns dismissal state). */
  suggestedUrl: string | null;
  onAccept: (url: string) => void;
  onDismiss: () => void;
}

export function UrlSuggestBanner({
  suggestedUrl,
  onAccept,
  onDismiss,
}: UrlSuggestBannerProps) {
  const { t } = useI18n();
  if (!suggestedUrl) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-primary/40 bg-primary/5 p-2.5"
    >
      <Link2
        className="mt-0.5 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium leading-5">
          {t("capture.suggest.title")}
        </p>
        <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
          {suggestedUrl}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-1 self-center">
        <Button
          type="button"
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onAccept(suggestedUrl)}
        >
          {t("capture.suggest.accept")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-muted-foreground"
          onClick={onDismiss}
        >
          <X className="size-3" aria-hidden="true" />
          {t("capture.suggest.keep")}
        </Button>
      </div>
    </div>
  );
}
