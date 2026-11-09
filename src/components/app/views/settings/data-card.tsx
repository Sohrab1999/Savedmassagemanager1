"use client";

// Settings — Data card (split out of settings-view.tsx at step 45): JSON
// export (D10 v1 — ZIP is roadmap #4 F3), the N2 import section, and the
// demo-only reset with its two-step confirmation. Byte-identical to the
// pre-split markup.

import {
  Download,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useResetSeed } from "@/hooks/queries";
import { ImportSection } from "@/components/app/views/settings/import-section";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { apiRoutes } from "@/lib/api";
import { dataSource } from "@/services/data-source";
import { toast } from "sonner";

export function DataCard() {
  const { t } = useI18n();
  const resetSeed = useResetSeed();
  const { user } = useAuth();
  const isCloud = Boolean(user);

  const downloadJson = (payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `savedbox-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    try {
      if (isCloud) {
        // Cloud mode: export straight from the user's Firestore data.
        const [notes, categories, tags, profile] = await Promise.all([
          dataSource.listNotes({ archived: false }),
          dataSource.listCategories(),
          dataSource.listTags(),
          dataSource.getProfile(),
        ]);
        downloadJson({
          exportedAt: new Date().toISOString(),
          source: "firestore",
          profile,
          notes: notes.items,
          categories: categories.items,
          tags: tags.items,
        });
        return;
      }
      await apiRoutes.exportData();
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("settings.data")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("settings.export")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.export.desc")}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => void exportData()}>
            <Download className="size-4" aria-hidden="true" />
            {t("common.save")}
          </Button>
        </div>

        {/* N2 — JSON import (merge-only, two-step guardrail) */}
        <ImportSection />

        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("settings.reset")}</p>
            <p className="text-xs text-muted-foreground">
              {isCloud ? t("settings.reset.demoOnly") : t("settings.reset.desc")}
            </p>
          </div>
          {isCloud ? (
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled>
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("settings.reset")}
            </Button>
          ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {t("settings.reset")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.reset.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.reset.confirm.desc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await resetSeed.mutateAsync();
                      toast.success(t("settings.reset.done"));
                    } catch {
                      toast.error(t("toast.error"));
                    }
                  }}
                >
                  {t("common.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
