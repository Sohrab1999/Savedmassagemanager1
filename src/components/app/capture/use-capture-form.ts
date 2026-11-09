"use client";

// Capture form SESSION model (step 45 split — owner rule: state models are
// their own modules). Owns: the form fields, the open-reset contract (incl.
// the F1/F2 external prefill application), the S2 title-paste conversion,
// the F5 accept/dismiss wiring inputs, the QE6 causal save validation +
// hint chain, the N10 debounce target + query, and the submit flow (B6 CTA).
// The dialog component consumes this model and renders only.

import { useEffect, useState, type ClipboardEvent } from "react";
import {
  emptyCaptureForm,
  uploadErrorMessage,
  type CaptureFormState,
} from "@/components/app/capture/form-state";
import { useCaptureUpload } from "@/components/app/capture/use-capture-upload";
import { useUrlSuggest } from "@/components/app/capture/use-url-suggest";
import { prefillFormPatch } from "@/lib/capture/capture-prefill";
import { type DuplicateCheckInput } from "@/lib/domain/types";
import { useCreateNote, useDuplicateCheck } from "@/hooks/queries";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export function useCaptureForm() {
  const { t } = useI18n();
  const open = useAppStore((state) => state.captureOpen);
  const setOpen = useAppStore((state) => state.setCaptureOpen);
  const openNote = useAppStore((state) => state.openNote);
  // F1/F2 — the external-channel payload applied exactly once per open.
  // (No store write happens during render — the store clears the prefill on
  // close/plain-open; see app-store.setCaptureOpen.)
  const capturePrefill = useAppStore((state) => state.capturePrefill);
  const createNote = useCreateNote();

  const [form, setForm] = useState<CaptureFormState>(emptyCaptureForm);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  // S2 — set when a pasted URL auto-converts the form to a link note.
  const [linkDetected, setLinkDetected] = useState(false);
  const [titleFromFile, setTitleFromFile] = useState(false);

  // N10 — soft duplicate warning: debounce the collidable fields and check
  // them against the whole non-trashed library. Informational ONLY — the
  // result never disables saving (owner rule: «ثبت دوباره همچنان آزاد است»).
  // setState happens ONLY inside the timer callback (never synchronously in
  // the effect — react-hooks/set-state-in-effect); the empty case commits
  // through a 0 ms timer, the typed case through the 400 ms debounce.
  const [dedupeTarget, setDedupeTarget] = useState<DuplicateCheckInput | null>(null);
  useEffect(() => {
    const url = form.url.trim() || null;
    const title = form.title.trim() || null;
    const delay = url || title ? 400 : 0;
    const timer = window.setTimeout(() => {
      setDedupeTarget(url || title ? { url, title } : null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [form.url, form.title]);
  const duplicateNote = useDuplicateCheck(dedupeTarget).data?.note ?? null;

  // F5 — the soft URL suggestion for the content field.
  const urlSuggest = useUrlSuggest(form.type, form.content);

  // P3 — the real-upload state machine lives in its own hook.
  const upload = useCaptureUpload(form, setForm, setTitleFromFile);

  // Reset + prefill the form whenever the dialog ENTERS the open state
  // (render-phase adjustment). `lastOpen` starts false so a first mount with
  // an ALREADY-open dialog (the F1/F2 intake paths: share landing and the
  // `#/capture` deep-link arrive before the auth gate resolves) still runs
  // the reset + prefill application exactly once.
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      // F1/F2 — apply the share/deep-link prefill; a plain open (no payload)
      // keeps the empty form. The STORE clears the payload on close and on
      // plain opens, so a payload can never leak into a later session.
      const patch = prefillFormPatch(capturePrefill);
      setForm(patch ? { ...emptyCaptureForm, ...patch } : emptyCaptureForm);
      setLinkDetected(Boolean(patch?.linkDetected));
      setPrefilled(Boolean(patch));
      setError(null);
      upload.reset();
      setTitleFromFile(false);
    }
  }

  const patch = (part: Partial<CaptureFormState>) =>
    setForm((current) => ({ ...current, ...part }));

  const submit = async () => {
    const invalid = saveDisabledReason;
    if (invalid) {
      setError(invalid);
      return;
    }
    try {
      const created = await createNote.mutateAsync({
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim() || null,
        url: form.type === "link" ? form.url.trim() : form.url.trim() || null,
        mediaUrl: form.mediaUrl.trim() || null,
        fileName: form.fileName,
        fileSize: form.fileSize,
        categoryId: form.categoryId === "none" ? null : form.categoryId,
        tagNames: form.tags,
      });
      // UX-B6 (A-3.2) — OPTIONAL organize CTA on the success toast; the save
      // itself stays ONE step and is never blocked or reshaped (P2/N10).
      toast.success(t("capture.saved"), {
        action: {
          label: t("capture.organizeCta"),
          onClick: () => openNote(created.id, { autoEdit: true }),
        },
      });
      setOpen(false);
    } catch {
      toast.error(t("toast.error"));
    }
  };

  // S2 — pasting a bare URL into the title converts the form to a link note.
  const handleTitlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text").trim();
    if (!/^https?:\/\/\S+$/i.test(text)) return;
    event.preventDefault();
    setForm((current) => ({ ...current, type: "link", url: text }));
    setLinkDetected(true);
  };

  // F5 — accept: move the URL into the link fields; the content survives
  // verbatim UNLESS it was exactly the URL (same spirit as the S2 paste).
  const acceptUrlSuggestion = (url: string) => {
    setForm((current) => ({
      ...current,
      type: "link",
      url,
      content: current.content.trim() === url ? "" : current.content,
    }));
    setLinkDetected(true);
  };

  // QE6 — causal reason on the disabled save (never a silent dead button).
  const saveDisabledReason = !form.title.trim()
    ? t("capture.titleRequired")
    : form.type === "text" && !form.content.trim()
      ? t("capture.contentRequired")
      : form.type === "link" && !/^https?:\/\/.+/i.test(form.url.trim())
        ? t("capture.urlRequired")
        : form.type === "file" && !form.mediaUrl.trim()
          ? t("capture.fileRequired")
          : undefined;

  // Hint chain — causal reason first, then contextual cues (F1/F2 prefill,
  // S2 link-detected, title-from-file, default).
  const titleHint = saveDisabledReason
    ?? (prefilled ? t("capture.prefill.hint") : null)
    ?? (linkDetected ? t("capture.linkDetected") : null)
    ?? (titleFromFile ? t("capture.titleFromFile") : null);

  return {
    open,
    setOpen,
    form,
    patch,
    error,
    linkDetected,
    titleHint,
    saveDisabledReason,
    duplicateNote,
    urlSuggest,
    upload,
    submit,
    handleTitlePaste,
    acceptUrlSuggestion,
    pending: createNote.isPending,
  };
}
