import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { RouteSearchable } from '../../layout/shell/route-searchable';
import { TaskStore } from '../../core/services/task.store';
import { UserService } from '../../core/services/user.service';
import { CreateTaskInput, Task, TaskStatus } from '../../core/models/task.model';
import { TaskActionEvent } from './task-card/task-card';
import { TaskColumn } from './task-column/task-column';
import { TaskFiltersBar } from './task-filters-bar/task-filters-bar';
import { TaskFormDialog } from './task-form/task-form-dialog';
import { mutationErrorMessage } from './mutation-error-message';

const COLUMNS: ReadonlyArray<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

/**
 * Smart/container: board, filters, search, and Create/Edit/Delete CRUD.
 *
 * Implements `RouteSearchable` so Shell can forward Topbar search input here
 * without injecting `TaskStore` itself. `TaskStore.searchTerm` resets on
 * destroy so leaving and returning to `/tasks` always starts unfiltered,
 * matching Topbar's own reset when the route deactivates.
 *
 * `ConfirmationService` is provided here (component-scoped, not root) since
 * PrimeNG ships it with no `providedIn` and nothing else in the app needs it.
 */
@Component({
  selector: 'app-task-board-page',
  imports: [TaskColumn, TaskFiltersBar, TaskFormDialog, ConfirmDialog, CdkDropListGroup],
  templateUrl: './task-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class TaskBoardPage implements RouteSearchable, OnDestroy {
  private readonly taskStore = inject(TaskStore);
  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /**
   * Sidebar's "+ New Task" CTA encodes intent as `/tasks?new` rather than
   * calling into this page directly, so it stays a plain, generic link with
   * no knowledge of `TaskFormDialog`/`TaskStore`. Read reactively (via
   * `toSignal`, not a one-time `route.snapshot` read) because a second CTA
   * click while this page is already mounted re-navigates to the same
   * route with the same query param present again — a snapshot is read
   * once per component lifetime and would miss that.
   */
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  constructor() {
    effect(() => {
      if (!this.queryParamMap().has('new')) {
        return;
      }
      // Never clobbers an already-open dialog (e.g. mid-Edit) — only opens
      // Create when nothing is open yet.
      if (!this.formOpen()) {
        this.openCreateForm();
      }
      this.clearNewTaskIntent();
    });
  }

  /**
   * Strips the one-shot `new` query param the instant it's read, via
   * `replaceUrl` rather than a normal navigation: this overwrites the
   * `?new` history entry instead of adding one, so the URL settles back to
   * bare `/tasks` immediately (nothing left to reopen on refresh) and Back
   * skips straight over this transient state to wherever the user actually
   * came from.
   */
  private clearNewTaskIntent(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { new: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

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

  private readonly filtersBar = viewChild(TaskFiltersBar);

  protected readonly formOpen = signal(false);
  protected readonly formMode = signal<'create' | 'edit'>('create');
  protected readonly editingTask = signal<Task | null>(null);

  protected readonly mutationPending = this.taskStore.mutationPending;
  protected readonly mutationError = this.taskStore.mutationError;
  /**
   * Delete and drag-drop status-change failures both have no open dialog to
   * show them in (ConfirmDialog closes itself immediately on Accept, before
   * the mutation resolves — see PrimeNG's ConfirmDialog.onAccept — and a
   * drag gesture never opens one at all), so both surface as a board-level
   * banner instead. Suppressed while the form dialog is open so a
   * create/edit failure — shown inline in the dialog itself — isn't
   * duplicated here.
   */
  protected readonly showMutationErrorBanner = computed(
    () => !this.formOpen() && !!this.mutationError(),
  );
  protected readonly mutationBannerMessage = computed(() =>
    mutationErrorMessage(this.mutationError()),
  );

  /** The element to refocus once the dialog/confirmation flow completes — the real trigger, never a menu item. */
  private pendingFocusRestore: HTMLElement | null = null;

  protected openCreateForm(): void {
    this.pendingFocusRestore = null;
    this.formMode.set('create');
    this.editingTask.set(null);
    this.formOpen.set(true);
  }

  protected openEditForm(event: TaskActionEvent): void {
    if (this.taskStore.mutationPending()) {
      return;
    }
    this.pendingFocusRestore = event.trigger;
    this.formMode.set('edit');
    this.editingTask.set(event.task);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.restoreFocus();
  }

  protected async handleSave(input: CreateTaskInput): Promise<void> {
    try {
      const task = this.editingTask();
      if (this.formMode() === 'edit' && task) {
        await this.taskStore.update(task.id, input);
      } else {
        await this.taskStore.create(input);
      }
      this.formOpen.set(false);
      this.restoreFocusAfterMutation();
    } catch {
      // taskStore.mutationError already holds the failure; the dialog stays
      // open and renders it inline (TaskFormDialog's own `error` input).
    }
  }

  protected confirmDelete(event: TaskActionEvent): void {
    if (this.taskStore.mutationPending()) {
      return;
    }
    this.pendingFocusRestore = event.trigger;
    this.confirmationService.confirm({
      header: 'Delete task',
      message: `Delete "${event.task.title}"? This cannot be undone.`,
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      defaultFocus: 'reject',
      accept: () => this.performDelete(event.task.id),
      // Fires for the explicit Reject click AND for Escape/backdrop dismiss
      // (PrimeNG's ConfirmDialog.close() emits the same rejectEvent for both).
      reject: () => this.restoreFocus(),
    });
  }

  private async performDelete(id: string): Promise<void> {
    try {
      await this.taskStore.remove(id);
      // The deleted card (and its kebab button) no longer exist — fall back
      // to the one trigger guaranteed to still be there.
      this.pendingFocusRestore = null;
      this.restoreFocusAfterMutation();
    } catch {
      // The task wasn't removed, so its kebab button is still in the DOM —
      // land back on it rather than the New Task fallback.
      this.restoreFocusAfterMutation();
    }
  }

  /**
   * Cross-column drop = a status change, delegated entirely to
   * `TaskStore.update()` so `completedAt` transition semantics stay
   * centralized — the same call `handleSave()` already makes for an edit.
   * A same-column drop (source and target status equal) is a deliberate
   * no-op: `Task` has no persisted order/position field, so nothing here
   * ever calls `moveItemInArray`/`transferArrayItem` or mutates a local
   * copy — `cdkDropListSortingDisabled` (set on every `TaskColumn`) already
   * suppresses the misleading intra-column reorder preview during the drag
   * itself. Drag is a pointer/touch gesture, not a keyboard action, so
   * unlike Edit/Delete there is no `pendingFocusRestore` bookkeeping here.
   */
  protected onCardDropped(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    const sourceStatus = event.previousContainer.data;
    const targetStatus = event.container.data;
    if (sourceStatus === targetStatus || this.taskStore.mutationPending()) {
      return;
    }
    this.changeStatus(event.item.data, targetStatus);
  }

  private async changeStatus(task: Task, status: TaskStatus): Promise<void> {
    try {
      await this.taskStore.update(task.id, { status });
    } catch {
      // taskStore.mutationError already holds the failure; showMutationErrorBanner
      // renders it — a drag gesture has no dialog of its own to show it in.
    }
  }

  /** Cancel/reject flows: nothing was ever disabled, so this can run synchronously. */
  private restoreFocus(): void {
    const element = this.pendingFocusRestore;
    this.pendingFocusRestore = null;
    if (element && document.contains(element)) {
      element.focus();
    } else {
      this.filtersBar()?.focusNewTaskButton();
    }
  }

  /**
   * Same as `restoreFocus()`, but for use right after an awaited `TaskStore`
   * mutation resolves. The element we're restoring focus to may have just
   * been re-enabled by `mutationPending` flipping to `false` (the New
   * Task/kebab `[disabled]` bindings) — that DOM update hasn't necessarily
   * been flushed yet at this exact point, and `.focus()` on a still-`disabled`
   * element is a no-op. Forcing a synchronous check first guarantees it has.
   */
  private restoreFocusAfterMutation(): void {
    const element = this.pendingFocusRestore;
    this.pendingFocusRestore = null;
    this.cdr.detectChanges();
    if (element && document.contains(element)) {
      element.focus();
    } else {
      this.filtersBar()?.focusNewTaskButton();
    }
  }
}
