import { Task, TaskPriority, TaskStatus } from './task.model';

export interface DistributionSlice<K extends string> {
  key: K;
  label: string;
  count: number;
  /** Rounded to the nearest integer per slice; may not sum to exactly 100. */
  percentage: number;
}

const PRIORITY_ORDER: ReadonlyArray<{ key: TaskPriority; label: string }> = [
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

const STATUS_ORDER: ReadonlyArray<{ key: TaskStatus; label: string }> = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function distribution<K extends string>(
  tasks: readonly Task[],
  order: ReadonlyArray<{ key: K; label: string }>,
  keyOf: (task: Task) => K,
): DistributionSlice<K>[] {
  const total = tasks.length;
  const counts = new Map<K, number>(order.map(({ key }) => [key, 0]));
  for (const task of tasks) {
    const key = keyOf(task);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return order.map(({ key, label }) => {
    const count = counts.get(key) ?? 0;
    return { key, label, count, percentage: total === 0 ? 0 : Math.round((count / total) * 100) };
  });
}

/** Task counts by priority, high → medium → low: the assignment's "priority distribution" chart. */
export function priorityDistribution(tasks: readonly Task[]): DistributionSlice<TaskPriority>[] {
  return distribution(tasks, PRIORITY_ORDER, (task) => task.priority);
}

/** Task counts by status, todo → in_progress → done: the assignment's "status distribution" chart. */
export function statusDistribution(tasks: readonly Task[]): DistributionSlice<TaskStatus>[] {
  return distribution(tasks, STATUS_ORDER, (task) => task.status);
}

/** CSS custom property (styles.css `@theme`) holding each priority's chart color: single source of truth, no duplicated hex. */
export const PRIORITY_COLOR_VARS: Record<TaskPriority, string> = {
  high: '--color-priority-high',
  medium: '--color-priority-medium',
  low: '--color-priority-low',
};

/** CSS custom property (styles.css `@theme`) holding each status's chart color. */
export const STATUS_COLOR_VARS: Record<TaskStatus, string> = {
  todo: '--color-status-todo',
  in_progress: '--color-status-in-progress',
  done: '--color-status-done',
};
