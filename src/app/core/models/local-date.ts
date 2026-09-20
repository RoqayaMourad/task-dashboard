const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses a date-only `YYYY-MM-DD` string as local midnight, not UTC midnight.
 * `new Date('2026-09-20')` would parse as UTC and can silently shift to the
 * previous local calendar day west of UTC; this avoids that.
 */
export function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole local calendar days from `from` to `to` (positive when `to` is
 * later). Both are normalized to local midnight first so a DST transition
 * between them can't shift the count by a fractional day.
 */
export function daysBetween(from: Date, to: Date): number {
  const ms = startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime();
  return Math.round(ms / MS_PER_DAY);
}
