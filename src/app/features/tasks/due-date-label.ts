import { daysBetween, parseDateOnly } from '../../core/models/local-date';
import { isTaskOverdue } from '../../core/models/overdue';
import { Task } from '../../core/models/task.model';

/**
 * The card's truthful due/overdue/completed line. Overdue status is decided
 * solely by `isTaskOverdue()` — this only adds human wording on top.
 */
export function dueDateLabel(task: Task, now = new Date()): string {
  if (task.status === 'done') {
    return completedLabel(task, now);
  }

  if (isTaskOverdue(task, now)) {
    const days = daysBetween(parseDateOnly(task.dueDate), now);
    return days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`;
  }

  const days = daysBetween(now, parseDateOnly(task.dueDate));
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }
  return `Due in ${days} days`;
}

function completedLabel(task: Task, now: Date): string {
  if (!task.completedAt) {
    return 'Completed';
  }

  const completedAt = new Date(task.completedAt);
  const days = daysBetween(completedAt, now);
  if (days === 0) {
    return 'Completed today';
  }
  if (days === 1) {
    return 'Completed yesterday';
  }
  return `Completed on ${completedAt.toLocaleDateString()}`;
}
