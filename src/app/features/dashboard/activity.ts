import { Task } from '../../core/models/task.model';

export interface ActivityItem {
  taskId: string;
  taskTitle: string;
  kind: 'created' | 'updated';
  /** ISO timestamp backing this item; formatting is left to the view. */
  at: string;
}

function parseTimestamp(value: string): number | undefined {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * One item per task, derived only from `createdAt`/`updatedAt`; there is no
 * audit log, so this can never say *what* changed or attribute the change to
 * the assignee. A task is "updated" only when both timestamps parse and
 * `updatedAt` is strictly later than `createdAt`; otherwise it's "created"
 * when `createdAt` parses; a task with no trustworthy timestamp is excluded
 * rather than guessed at.
 */
export function deriveRecentActivity(tasks: readonly Task[], limit = 5): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const task of tasks) {
    const createdMs = parseTimestamp(task.createdAt);
    const updatedMs = parseTimestamp(task.updatedAt);

    if (createdMs !== undefined && updatedMs !== undefined && updatedMs > createdMs) {
      items.push({ taskId: task.id, taskTitle: task.title, kind: 'updated', at: task.updatedAt });
    } else if (createdMs !== undefined) {
      items.push({ taskId: task.id, taskTitle: task.title, kind: 'created', at: task.createdAt });
    }
  }

  return items
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || a.taskId.localeCompare(b.taskId))
    .slice(0, limit);
}
