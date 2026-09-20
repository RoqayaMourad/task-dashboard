export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Assignee {
  id: string;
  name: string;
  /** Two-letter initials string (e.g. "JD"), not an image URL. */
  avatar: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Date-only, `YYYY-MM-DD`; distinct format from the ISO datetime fields below. */
  dueDate: string;
  /** ISO datetime, present only when `status === 'done'`. */
  completedAt?: string;
  assignee: Assignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Fields a user actually provides when creating a task. Excludes `id`
 * (assigned by json-server), `createdAt`/`updatedAt`/`completedAt` (stamped
 * by TaskStore, since json-server has no business logic of its own to do this).
 */
export interface CreateTaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: Assignee;
  tags: string[];
}

export type UpdateTaskInput = Partial<CreateTaskInput>;
