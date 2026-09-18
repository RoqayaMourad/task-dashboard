import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  ResourceStatus,
  viewChild,
} from '@angular/core';
import { Assignee, TaskPriority, TaskStatus } from '../../../core/models/task.model';

interface StatusOption {
  value: TaskStatus | 'all';
  label: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

/**
 * Dumb: no filter state of its own — every value is an input, every change
 * an output. `TaskBoardPage` wires these straight to `TaskStore`'s existing
 * filter signals.
 */
@Component({
  selector: 'app-task-filters-bar',
  templateUrl: './task-filters-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFiltersBar {
  readonly statusFilter = input.required<TaskStatus | 'all'>();
  readonly priorityFilter = input.required<TaskPriority | 'all'>();
  readonly assigneeFilter = input.required<string | 'all'>();
  readonly assigneeOptions = input.required<Assignee[]>();
  readonly assigneeOptionsStatus = input.required<ResourceStatus>();
  readonly mutationPending = input(false);

  readonly statusFilterChange = output<TaskStatus | 'all'>();
  readonly priorityFilterChange = output<TaskPriority | 'all'>();
  readonly assigneeFilterChange = output<string | 'all'>();
  readonly newTaskRequested = output<void>();

  protected readonly statusOptions = STATUS_OPTIONS;

  private readonly newTaskButton = viewChild<ElementRef<HTMLButtonElement>>('newTaskButton');

  /** Returns focus to the New Task trigger — called by TaskBoardPage after the create/edit dialog closes. */
  focusNewTaskButton(): void {
    this.newTaskButton()?.nativeElement.focus();
  }
}
