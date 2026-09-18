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

/** Buckets tasks into the three Kanban board columns. */
export function groupTasksByStatus(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  return groups;
}
