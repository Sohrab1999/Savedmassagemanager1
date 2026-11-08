"use client";

// Authentication gate: sign-in / sign-up (Firebase Auth) plus an explicitly
// labeled demo entry point. Rendered by AppShell when no verified session
// exists and the user has not chosen demo mode.

import { useState, type FormEvent } from "react";
import { Bookmark, FlaskConical, Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LanguageToggle } from "@/components/app/header";
import { AuthUiError, useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import type { I18nKey } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthGate() {
  const { t } = useI18n();
  const { signIn, signUp, enterDemo, configured, emulator } = useAuth();

  const [tab, setTab] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setErrorKey("auth.errors.invalid-email");
      return;
    }
    if (password.length < 6) {
      setErrorKey("auth.errors.weak-password");
      return;
    }

    setErrorKey(null);
    setPending(true);
    try {
      if (tab === "signIn") {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password, displayName);
      }
    } catch (error) {
      setErrorKey(
        error instanceof AuthUiError
          ? error.key
          : "auth.errors.default",
      );
    } finally {
      setPending(false);
    }
  };

  const switchTab = (next: "signIn" | "signUp") => {
    setTab(next);
    setErrorKey(null);
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="absolute top-3 end-3">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Bookmark className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{t("app.name")}</h1>
            <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
            {(
              [
                { id: "signIn", label: t("auth.signIn"), icon: LogIn },
                { id: "signUp", label: t("auth.signUp"), icon: UserPlus },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => switchTab(item.id)}
                  className={cn(
                    "flex min-h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors",
                    tab === item.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            {tab === "signIn" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
          </p>

          <form onSubmit={submit} className="space-y-3.5">
            {tab === "signUp" ? (
              <div className="space-y-1.5">
                <Label htmlFor="auth-name">{t("auth.displayName")}</Label>
                <Input
                  id="auth-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email">{t("auth.email")}</Label>
              <Input
                id="auth-email"
                dir="ltr"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">{t("auth.password")}</Label>
              <Input
                id="auth-password"
                dir="ltr"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={tab === "signIn" ? "current-password" : "new-password"}
              />
            </div>

            {errorKey ? (
              <Alert variant="destructive" className="py-2.5">
                <AlertDescription className="text-xs">
                  {t(errorKey as I18nKey)}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full gap-2" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4" aria-hidden="true" />
              )}
              {pending
                ? t("common.loading")
                : tab === "signIn"
                  ? t("auth.signIn")
                  : t("auth.signUp")}
            </Button>
          </form>
        </div>

        {/* Backend status */}
        {!configured ? (
          <Alert className="py-2.5">
            <AlertTitle className="text-xs font-semibold">
              {t("auth.notConfiguredTitle")}
            </AlertTitle>
            <AlertDescription className="text-xs leading-5">
              {t("auth.notConfiguredDesc")}
            </AlertDescription>
          </Alert>
        ) : emulator ? (
          <p className="text-center text-[11px] text-muted-foreground">
            {t("auth.emulatorBadge")}
          </p>
        ) : null}

        {/* Explicit demo entry */}
        <div className="space-y-2 text-center">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={enterDemo}
          >
            <FlaskConical className="size-4" aria-hidden="true" />
            {t("auth.demo.enter")}
            <Badge variant="secondary" className="ms-1 rounded-full text-[10px]">
              {t("auth.demoBadge")}
            </Badge>
          </Button>
          <p className="mx-auto max-w-xs text-[11px] leading-4 text-muted-foreground">
            {t("auth.demo.note")}
          </p>
        </div>
      </div>
    </div>
  );
}
