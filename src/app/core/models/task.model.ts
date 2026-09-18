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
  /** Date-only, `YYYY-MM-DD` — distinct format from the ISO datetime fields below. */
  dueDate: string;
  /**
   * Present (and only ever `true`) on some overdue seed tasks; absent, not
   * `false`, otherwise. Not derived by the supplied generator from any live
   * date comparison — treat as an unreliable hint, not a source of truth.
   */
  isOverdue?: boolean;
  /** ISO datetime, present only when `status === 'done'`. */
  completedAt?: string;
  assignee: Assignee;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
