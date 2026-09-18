import { ChangeDetectionStrategy, Component, input, output, ResourceStatus } from '@angular/core';
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

  readonly statusFilterChange = output<TaskStatus | 'all'>();
  readonly priorityFilterChange = output<TaskPriority | 'all'>();
  readonly assigneeFilterChange = output<string | 'all'>();

  protected readonly statusOptions = STATUS_OPTIONS;
}
