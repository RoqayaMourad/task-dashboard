import { parseDateOnly } from './local-date';
import { Task, TaskPriority, TaskStatus } from './task.model';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  assigneeId: string | 'all';
}

/** Real-time, case-insensitive search across title + description, plus status/priority/assignee filters. */
export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  const term = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }
    if (filters.assigneeId !== 'all' && task.assignee.id !== filters.assigneeId) {
      return false;
    }
    if (
      term &&
      !task.title.toLowerCase().includes(term) &&
      !task.description.toLowerCase().includes(term)
    ) {
      return false;
    }
    return true;
  });
}

function idTiebreak(a: Task, b: Task): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Earliest/overdue due date first, observable in the supplied Figma
 * reference (To Do/In Progress cards run overdue → soonest → latest due
 * date), not an explicit textual assignment requirement. `dueDate` is
 * date-only (`YYYY-MM-DD`), parsed via `parseDateOnly` for the same local-
 * midnight semantics `isTaskOverdue`/`dueDateLabel` already use for this
 * field, never the fixture's own unreliable `isOverdue`. An unparseable
 * `dueDate` (defensive only) sorts after every valid one.
 */
function compareByDueDateAscending(a: Task, b: Task): number {
  const aTime = parseDateOnly(a.dueDate).getTime();
  const bTime = parseDateOnly(b.dueDate).getTime();
  const aValid = !Number.isNaN(aTime);
  const bValid = !Number.isNaN(bTime);

  if (aValid && bValid && aTime !== bTime) {
    return aTime - bTime;
  }
  if (aValid !== bValid) {
    return aValid ? -1 : 1;
  }
  return idTiebreak(a, b);
}

/**
 * Most recently completed first, also observable in the Figma reference
 * (Done cards run newest → oldest completion). Done's meaningful axis is
 * completion recency, not due-date urgency: a finished task's original due
 * date no longer matters once it's done, so this deliberately does not
 * reuse `compareByDueDateAscending`. A missing or unparseable `completedAt`
 * (defensive only; `resolveCompletedAt` always stamps a real one on
 * entering `done`) sorts after every valid one.
 */
function compareByCompletedAtDescending(a: Task, b: Task): number {
  const aTime = a.completedAt ? Date.parse(a.completedAt) : NaN;
  const bTime = b.completedAt ? Date.parse(b.completedAt) : NaN;
  const aValid = !Number.isNaN(aTime);
  const bValid = !Number.isNaN(bTime);

  if (aValid && bValid && aTime !== bTime) {
    return bTime - aTime;
  }
  if (aValid !== bValid) {
    return aValid ? -1 : 1;
  }
  return idTiebreak(a, b);
}

/**
 * Buckets tasks into the three Kanban board columns, each ordered by the
 * axis that's actually meaningful for it (see the comparators above).
 * Never sorts or mutates its `tasks` input: each bucket is a fresh array
 * built here via `push`, sorted in place before being returned.
 */
export function groupTasksByStatus(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  groups.todo.sort(compareByDueDateAscending);
  groups.in_progress.sort(compareByDueDateAscending);
  groups.done.sort(compareByCompletedAtDescending);
  return groups;
}
