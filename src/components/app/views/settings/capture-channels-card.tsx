"use client";

// F1 + F2 — the «External capture channels» settings card: the honest setup
// surface for the two new capture bridges.
//   • F1 Share Target — what it does, where it works (installed PWA on
//     Android/desktop Chromium) and the HONEST iOS limitation (platform-side).
//   • F2 Bookmarklet — the ready-to-paste snippet that opens the app on
//     `#/capture?url=…&title=…` (text-only prefill, XSS-free by construction:
//     values flow exclusively through React-controlled inputs).
// The card is informational: no behavior toggle, no hidden state.

import { useState } from "react";
import { Link2, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMounted } from "@/hooks/use-mounted";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function CaptureChannelsCard() {
  const { t } = useI18n();
  const mounted = useMounted();
  const [copied, setCopied] = useState(false);

  // The bookmarklet snippet is built from the LIVE origin so it works in any
  // deployment; SSR renders an empty string and the card states that setup
  // happens in the app itself (honest, no fabricated value).
  const origin = mounted ? window.location.origin : "";
  const bookmarklet =
    `javascript:(function(){window.open('${origin}/#/capture?url='` +
    `+encodeURIComponent(location.href)+'&title='` +
    `+encodeURIComponent(document.title),'_blank','noopener');})();`;

  const copySnippet = async () => {
    const succeed = () => {
      setCopied(true);
      toast.success(t("common.copied"));
      window.setTimeout(() => setCopied(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(bookmarklet);
      succeed();
    } catch {
      // Legacy fallback — restricted contexts (webviews, older browsers,
      // clipboard-permission denials) still deserve the working copy path.
      try {
        const helper = document.createElement("textarea");
        helper.value = bookmarklet;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const ok = document.execCommand("copy");
        helper.remove();
        if (ok) succeed();
        else toast.error(t("toast.error"));
      } catch {
        toast.error(t("toast.error"));
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Link2 className="size-4 text-primary" aria-hidden="true" />
          {t("settings.captureChannels")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-6 text-muted-foreground">
          {t("settings.captureChannels.desc")}
        </p>

        {/* F1 — Web Share Target (installed PWA) */}
        <div className="space-y-1.5 rounded-lg border p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <MousePointerClick className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("settings.captureChannels.share.title")}
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] leading-4 text-secondary-foreground" dir="ltr">
              F1
            </span>
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("settings.captureChannels.share.desc")}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("settings.captureChannels.share.ios")}
          </p>
        </div>

        {/* F2 — Bookmarklet (desktop) */}
        <div className="space-y-1.5 rounded-lg border p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Link2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("settings.captureChannels.bookmarklet.title")}
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] leading-4 text-secondary-foreground" dir="ltr">
              F2
            </span>
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("settings.captureChannels.bookmarklet.desc")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              dir="ltr"
              value={mounted ? bookmarklet : ""}
              aria-label={t("settings.captureChannels.bookmarklet.label")}
              className="font-mono text-[11px]"
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => void copySnippet()}
              disabled={!mounted}
              aria-pressed={copied}
            >
              {t("settings.captureChannels.copy")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
