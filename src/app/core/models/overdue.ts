import { parseDateOnly, startOfLocalDay } from './local-date';
import { Task } from './task.model';

/**
 * The single source of truth for "is this task overdue": the API's own
 * `isOverdue` field (when present) is unreliable fixture metadata and is
 * never consulted here.
 */
export function isTaskOverdue(task: Pick<Task, 'status' | 'dueDate'>, now = new Date()): boolean {
  if (task.status === 'done') {
    return false;
  }
  return parseDateOnly(task.dueDate) < startOfLocalDay(now);
}
