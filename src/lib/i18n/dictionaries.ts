// Flat, dotted-key dictionaries — locale tables live in sibling files
// (dictionaries-en.ts / dictionaries-fa.ts). Every import site keeps working:
// this module re-exports the tables and the key type.

export type { Locale, I18nKey } from "@/lib/i18n/dictionaries-en";
export { en } from "@/lib/i18n/dictionaries-en";
export { fa } from "@/lib/i18n/dictionaries-fa";

import { en } from "@/lib/i18n/dictionaries-en";
import { fa } from "@/lib/i18n/dictionaries-fa";
import type { I18nKey, Locale } from "@/lib/i18n/dictionaries-en";

export const dictionaries: Record<Locale, Record<I18nKey, string>> = { en, fa };
