// Locale-aware formatting helpers (Persian digits via Intl where fitting).

import type { Locale } from "@/lib/i18n/dictionaries";

const intlLocale = (locale: Locale) => (locale === "fa" ? "fa-IR" : "en-US");

export function formatNumber(value: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(intlLocale(locale)).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso: string, locale: Locale): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const num = (value: number) => formatNumber(value, locale);

  // Localized inline to avoid a formatter -> i18n module cycle.
  if (minutes < 1) return locale === "fa" ? "همین حالا" : "just now";
  if (minutes < 60)
    return locale === "fa" ? `${num(minutes)} دقیقه پیش` : `${minutes} min ago`;
  if (hours < 24)
    return locale === "fa" ? `${num(hours)} ساعت پیش` : `${hours} h ago`;
  if (days === 1) return locale === "fa" ? "دیروز" : "yesterday";
  if (days < 7)
    return locale === "fa" ? `${num(days)} روز پیش` : `${days} d ago`;
  const weeks = Math.max(Math.floor(days / 7), 1);
  return locale === "fa" ? `${num(weeks)} هفته پیش` : `${weeks} w ago`;
}

export function formatBytes(bytes: number, locale: Locale): string {
  const unitsFa = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
  const unitsEn = ["B", "KB", "MB", "GB"];
  const units = locale === "fa" ? unitsFa : unitsEn;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = unitIndex === 0 ? value : Math.round(value * 10) / 10;
  return `${formatNumber(rounded, locale)} ${units[unitIndex]}`;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
