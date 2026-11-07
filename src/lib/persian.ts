// N3 — Persian search quality: shared text utilities.
//
// Persian input breaks search in three ways: Arabic letters (ي/ى vs ی, ك vs ک),
// diacritics (اعراب), and the zero-width non-joiner (نیم‌فاصله). A user typing
// «كتاب» with an Arabic keyboard must get exactly the results of «کتاب».
//
// Ground rule (owner order): normalization is used ONLY for comparison — the
// stored data is never rewritten. Both the demo backend (Prisma service layer)
// and the cloud backend (client-side filter over the live G1 array) funnel
// every comparison through `normalizePersian`, and the NoteCard highlighter
// matches the same equivalences directly on the original text so <mark> ranges
// stay inside real characters.

/** Folds Arabic-script variants, strips diacritics/ZWNJ, unifies digits and
 * lower-cases Latin — compare-only; input strings are never persisted. */
export function normalizePersian(input: string): string {
  return input
    // diacritics (U+064B–U+065F), superscript alef (U+0670), Quranic marks
    // (U+06D6–U+06ED) and tatweel (U+0640) never change meaning for search
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    // ZWNJ (نیم‌فاصله), ZWJ and BOM: «می‌روم» must match «میروم»
    .replace(/[\u200C\u200D\uFEFF]/g, "")
    // Arabic yeh / dotless yeh / hamza-on-ya → Persian yeh
    .replace(/[\u064A\u0649\u0626]/g, "\u06CC")
    // Arabic kaf → Persian kaf
    .replace(/\u0643/g, "\u06A9")
    // alef variants → bare alef
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    // heh variants → bare heh
    .replace(/[\u06C0\u0629]/g, "\u0647")
    // waw with hamza → bare waw
    .replace(/\u0624/g, "\u0648")
    // Persian + Arabic-Indic digits → ASCII digits
    .replace(/[\u06F0-\u06F9]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 48),
    )
    .replace(/[\u0660-\u0669]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48),
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Highlighting — matches the SAME equivalences on the ORIGINAL string so the
// marked range always wraps real characters (diacritics between letters stay
// in place, Arabic forms get marked just like Persian ones).
// ---------------------------------------------------------------------------

export interface HighlightSegment {
  text: string;
  hit: boolean;
}

/** Characters that are visually/semantically interchangeable with a Persian
 * base letter (mirrors the folding table above). */
const EQUIVALENCE_CLASSES: Record<string, string> = {
  "\u06CC": "[\u06CC\u064A\u0649\u0626]", // ی
  "\u064A": "[\u06CC\u064A\u0649\u0626]", // ي
  "\u0649": "[\u06CC\u064A\u0649\u0626]", // ى
  "\u0626": "[\u06CC\u064A\u0649\u0626]", // ئ
  "\u06A9": "[\u06A9\u0643]", // ک
  "\u0643": "[\u06A9\u0643]", // ك
  "\u0627": "[\u0627\u0623\u0625\u0622\u0671]", // ا
  "\u0623": "[\u0627\u0623\u0625\u0622\u0671]", // أ
  "\u0625": "[\u0627\u0623\u0625\u0622\u0671]", // إ
  "\u0622": "[\u0627\u0623\u0625\u0622\u0671]", // آ
  "\u0647": "[\u0647\u06C0\u0629]", // ه
  "\u0629": "[\u0647\u06C0\u0629]", // ة
  "\u06C0": "[\u0647\u06C0\u0629]", // ۀ
  "\u0648": "[\u0648\u0624]", // و
  "\u0624": "[\u0648\u0624]", // ؤ
};

/** Separators allowed BETWEEN the characters of the query when matching the
 * original text: ZWNJ/ZWJ, diacritics, tatweel. */
const BETWEEN =
  "[\\u200C\\u200D\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*";

/** Builds a case- and variant-insensitive RegExp for the query over ORIGINAL
 * text. Diacritics/ZWNJ inside the QUERY are dropped first (they are noise —
 * «مُطالعه» must highlight «مطالعه»), while the same characters are still
 * allowed BETWEEN the query's characters in the DATA. Returns null when the
 * query has no matchable characters. */
export function highlightRegexFor(query: string): RegExp | null {
  const parts: string[] = [];
  for (const ch of query) {
    // noise in the query itself: diacritics, tatweel, ZWNJ/ZWJ
    if (/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200C\u200D]/.test(ch)) continue;
    const cls = EQUIVALENCE_CLASSES[ch];
    if (cls) parts.push(cls);
    else parts.push(ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }
  if (parts.length === 0) return null;
  try {
    return new RegExp(parts.join(BETWEEN), "gi");
  } catch {
    return null;
  }
}

/** Splits `text` into hit/plain segments for <mark> rendering. Returns null
 * when nothing matched (callers keep their plain rendering path). */
export function splitHighlight(
  text: string,
  regex: RegExp | null,
): HighlightSegment[] | null {
  if (!regex || !text) return null;
  regex.lastIndex = 0;
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let matched = false;
  for (const match of text.matchAll(regex)) {
    if (match.index === undefined) continue;
    matched = true;
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), hit: false });
    }
    segments.push({ text: match[0], hit: true });
    cursor = match.index + match[0].length;
  }
  if (!matched) return null;
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), hit: false });
  }
  return segments;
}

/** Index of the first match of the highlight regex in `text`, or -1. */
export function firstMatchIndex(text: string, regex: RegExp | null): number {
  if (!regex || !text) return -1;
  regex.lastIndex = 0;
  const match = regex.exec(text);
  return match ? match.index : -1;
}
