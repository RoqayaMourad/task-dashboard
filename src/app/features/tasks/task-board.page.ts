import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject } from '@angular/core';
import { RouteSearchable } from '../../layout/shell/route-searchable';
import { TaskStore } from '../../core/services/task.store';
import { UserService } from '../../core/services/user.service';
import { TaskStatus } from '../../core/models/task.model';
import { TaskColumn } from './task-column/task-column';
import { TaskFiltersBar } from './task-filters-bar/task-filters-bar';

const COLUMNS: ReadonlyArray<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

/**
 * Smart/container. Read-only this increment: filtering + search only, no
 * create/edit/delete (Increment 3) — the "+ New Task" trigger and each
 * card's kebab menu stay genuinely disabled/absent rather than fake-interactive.
 *
 * Implements `RouteSearchable` so Shell can forward Topbar search input here
 * without injecting `TaskStore` itself. `TaskStore.searchTerm` resets on
 * destroy so leaving and returning to `/tasks` always starts unfiltered,
 * matching Topbar's own reset when the route deactivates.
 */
@Component({
  selector: 'app-task-board-page',
  imports: [TaskColumn, TaskFiltersBar],
  templateUrl: './task-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardPage implements RouteSearchable, OnDestroy {
  private readonly taskStore = inject(TaskStore);
  private readonly userService = inject(UserService);

  protected readonly columns = COLUMNS;

  protected readonly taskStatus = this.taskStore.status;
  protected readonly tasksByStatus = this.taskStore.tasksByStatus;

  /** Same reasoning as Phase 12's Dashboard: only skeleton when there's genuinely nothing resolved yet. */
  protected readonly boardSkeleton = computed(
    () =>
      this.taskStatus() === 'loading' ||
      (this.taskStatus() === 'reloading' && this.taskStore.tasks().length === 0),
  );

  protected readonly statusFilter = this.taskStore.statusFilter;
  protected readonly priorityFilter = this.taskStore.priorityFilter;
  protected readonly assigneeFilter = this.taskStore.assigneeFilter;

  protected readonly assigneeOptionsStatus = this.userService.users.status;
  /**
   * `value()` throws while the resource is in its 'error' state (see Phase
   * 12) — `TaskFiltersBar` already renders its own error UI from
   * `assigneeOptionsStatus`, so this just needs to never throw, not carry
   * real data, when there isn't any.
   */
  protected readonly assigneeOptions = computed(() =>
    this.assigneeOptionsStatus() === 'error' ? [] : this.userService.users.value(),
  );

  protected retryTasks(): void {
    this.taskStore.reload();
  }

  setSearchTerm(term: string): void {
    this.taskStore.searchTerm.set(term);
  }

  ngOnDestroy(): void {
    this.taskStore.searchTerm.set('');
  }
}
