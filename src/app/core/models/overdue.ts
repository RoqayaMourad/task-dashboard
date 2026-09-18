import { Task } from './task.model';

/**
 * Parses a date-only `YYYY-MM-DD` string as local midnight, not UTC midnight.
 * `new Date('2026-09-20')` would parse as UTC and can silently shift to the
 * previous local calendar day west of UTC — this avoids that.
 */
function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The single source of truth for "is this task overdue" — the API's own
 * `isOverdue` field (when present) is unreliable fixture metadata and is
 * never consulted here.
 */
export function isTaskOverdue(task: Pick<Task, 'status' | 'dueDate'>, now = new Date()): boolean {
  if (task.status === 'done') {
    return false;
  }
  return parseDateOnly(task.dueDate) < startOfLocalDay(now);
}
