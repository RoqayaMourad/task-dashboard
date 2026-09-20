import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from '../models/task.model';
import { resolveCompletedAt } from '../models/task-completion';
import { filterTasks, groupTasksByStatus } from '../models/task-filtering';
import { HttpCache } from '../http/http-cache';

const TASKS_URL = '/api/tasks';

/** What json-server may literally send back: `completedAt` as `null`, not absent, once cleared via PATCH. */
type TaskWire = Omit<Task, 'completedAt'> & { completedAt?: string | null };

function normalize(raw: TaskWire): Task {
  return { ...raw, completedAt: raw.completedAt ?? undefined };
}

/**
 * Single source of truth for tasks. The `GET /api/tasks` httpResource IS the
 * authoritative in-memory collection; mutations reconcile their server
 * response directly into it via the resource's own writable API
 * (`update`/`set`), never a parallel signal.
 *
 * Mutation concurrency: at most one task mutation may be in flight at a
 * time. A second call while one is pending is rejected immediately (no HTTP
 * request made) rather than queued or silently dropped, matching how the
 * eventual UI will disable mutation controls while a request is pending.
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(HttpCache);

  private readonly taskResource = httpResource<Task[]>(() => TASKS_URL, { defaultValue: [] });

  readonly tasks = computed(() => this.taskResource.value());
  readonly isLoading = this.taskResource.isLoading;
  /** Error from the GET /api/tasks read, distinct from `mutationError` below. */
  readonly readError = this.taskResource.error;
  /**
   * 'loading' (no data yet) vs 'reloading' (retrying while `tasks()` still
   * holds the last resolved list) so consumers can tell a first fetch from a
   * background refresh instead of collapsing both into `isLoading`.
   */
  readonly status = this.taskResource.status;

  readonly searchTerm = signal('');
  readonly statusFilter = signal<TaskStatus | 'all'>('all');
  readonly priorityFilter = signal<TaskPriority | 'all'>('all');
  readonly assigneeFilter = signal<string | 'all'>('all');

  readonly filteredTasks = computed(() =>
    filterTasks(this.tasks(), {
      search: this.searchTerm(),
      status: this.statusFilter(),
      priority: this.priorityFilter(),
      assigneeId: this.assigneeFilter(),
    }),
  );
  readonly tasksByStatus = computed(() => groupTasksByStatus(this.filteredTasks()));

  readonly mutationPending = signal(false);
  /** Preserves the real HttpErrorResponse (status, server body), never normalized away. */
  readonly mutationError = signal<HttpErrorResponse | Error | undefined>(undefined);

  /** Manual retry for the GET /api/tasks read; httpResource has no built-in retry/backoff. */
  reload(): boolean {
    return this.taskResource.reload();
  }

  async create(input: CreateTaskInput): Promise<Task> {
    this.beginMutation();
    try {
      const now = new Date().toISOString();
      const body = {
        ...input,
        createdAt: now,
        updatedAt: now,
        completedAt: resolveCompletedAt(undefined, input.status, undefined, now),
      };
      const raw = await firstValueFrom(this.http.post<TaskWire>(TASKS_URL, body));
      const created = normalize(raw);
      this.taskResource.update((tasks) => [...tasks, created]);
      this.cache.delete(TASKS_URL);
      this.endMutation();
      return created;
    } catch (err) {
      this.failMutation(err);
      throw err;
    }
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    this.beginMutation();
    try {
      const existing = this.tasks().find((task) => task.id === id);
      if (!existing) {
        throw new Error(`Task "${id}" was not found in the current task collection.`);
      }
      const now = new Date().toISOString();
      const nextStatus = input.status ?? existing.status;
      const body = {
        ...input,
        updatedAt: now,
        completedAt: resolveCompletedAt(existing.status, nextStatus, existing.completedAt, now),
      };
      const raw = await firstValueFrom(this.http.patch<TaskWire>(`${TASKS_URL}/${id}`, body));
      const updated = normalize(raw);
      this.taskResource.update((tasks) => tasks.map((task) => (task.id === id ? updated : task)));
      this.cache.delete(TASKS_URL);
      this.endMutation();
      return updated;
    } catch (err) {
      this.failMutation(err);
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    this.beginMutation();
    try {
      await firstValueFrom(this.http.delete<void>(`${TASKS_URL}/${id}`));
      this.taskResource.update((tasks) => tasks.filter((task) => task.id !== id));
      this.cache.delete(TASKS_URL);
      this.endMutation();
    } catch (err) {
      this.failMutation(err);
      throw err;
    }
  }

  private beginMutation(): void {
    if (this.mutationPending()) {
      throw new Error('A task mutation is already in progress.');
    }
    this.mutationPending.set(true);
    this.mutationError.set(undefined);
  }

  private endMutation(): void {
    this.mutationPending.set(false);
  }

  private failMutation(err: unknown): void {
    this.mutationPending.set(false);
    this.mutationError.set(
      err instanceof HttpErrorResponse || err instanceof Error ? err : new Error(String(err)),
    );
  }
}
