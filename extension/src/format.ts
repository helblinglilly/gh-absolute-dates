import { format } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import type { Settings } from "./settings";

// Matches a quoted literal ('at'), an escaped quote (''), or a run of one
// letter (a date-fns token such as "MMM" or "yyyy"). Reference:
// https://date-fns.org/docs/format
const SEGMENT_RE = /'(?:[^']|'')*'|''|([a-zA-Z])\1*/g;

// Token letters that describe the calendar date (era, year, quarter, month,
// week, day). Everything else (h H m s a ...) is time-of-day.
const DATE_LETTERS = "GyYuQqMLwIdDEeci";
// Year-only tokens (calendar year, week-numbering year, extended year).
const YEAR_LETTERS = "yYu";

// Characters that count as separators between tokens. ":" is deliberately
// absent: it belongs to the time ("HH:mm"), not to the gap around a date.
const SEP_END = /[\s,.\-/|@·–—()[\]]+$/;
const SEP_START = /^[\s,.\-/|@·–—()[\]]+/;

/**
 * Removes tokens whose letter is in `letters`. A removed token takes the
 * separators before it with it ("d MMM yyyy, HH:mm" -> "d MMM, HH:mm"); if
 * nothing is before it, it takes the separators after it instead
 * ("yyyy-MM-dd HH:mm" -> "MM-dd HH:mm"). Quoted literals are always kept.
 */
function stripTokens(pattern: string, letters: string): string {
  let out = "";
  let last = 0;
  let eatLeadingSep = false;

  // Literal text between tokens; drops its leading separators if the token
  // before it was removed from the very start of the output.
  const addGap = (gap: string) => {
    out += eatLeadingSep ? gap.replace(SEP_START, "") : gap;
    if (gap) eatLeadingSep = false;
  };

  for (const m of pattern.matchAll(SEGMENT_RE)) {
    addGap(pattern.slice(last, m.index));
    last = m.index! + m[0].length;

    const letter = m[1];
    if (letter && letters.includes(letter)) {
      out = out.replace(SEP_END, "");
      if (out === "") eatLeadingSep = true;
    } else {
      out += m[0];
      eatLeadingSep = false;
    }
  }
  addGap(pattern.slice(last));
  return out;
}

/** "HH:mm, MMM d, yyyy" -> "HH:mm"; "HH:mm 'on' d MMM" -> "HH:mm 'on'". */
export const stripDateTokens = (pattern: string) => stripTokens(pattern, DATE_LETTERS);

/** "HH:mm, MMM d, yyyy" -> "HH:mm, MMM d". */
export const stripYearTokens = (pattern: string) => stripTokens(pattern, YEAR_LETTERS);

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Throws a RangeError if the pattern isn't valid date-fns syntax. */
export function formatTimestamp(date: Date, s: Settings, now = new Date()): string {
  // TODO(human): when s.useUtc is set, reassign `date` and `now` so the
  // today/this-year checks and format() below all operate in UTC.

  let pattern = s.format;
  if (s.hideDateToday && isSameDay(date, now)) {
    pattern = stripDateTokens(pattern);
  } else if (s.hideYearThisYear && date.getFullYear() === now.getFullYear()) {
    pattern = stripYearTokens(pattern);
  }
  return format(date, pattern);
}
