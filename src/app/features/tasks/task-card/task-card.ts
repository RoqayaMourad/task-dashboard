import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { isTaskOverdue } from '../../../core/models/overdue';
import { Task, TaskPriority } from '../../../core/models/task.model';
import { dueDateLabel } from '../due-date-label';

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  high: 'text-priority-high bg-priority-high-bg',
  medium: 'text-priority-medium bg-priority-medium-bg',
  low: 'text-priority-low bg-priority-low-bg',
};

/**
 * Dumb: renders a resolved `Task` only. No edit/delete affordance yet — that
 * arrives in Increment 3 when it does something real (Phase 9 precedent:
 * never ship a clickable-but-inert control).
 */
@Component({
  selector: 'app-task-card',
  templateUrl: './task-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();

  readonly priorityClass = computed(() => PRIORITY_CLASS[this.task().priority]);
  readonly overdue = computed(() => isTaskOverdue(this.task()));
  readonly dueLabel = computed(() => dueDateLabel(this.task()));
  readonly metaIcon = computed(() => {
    if (this.task().status === 'done') return '✅';
    return this.overdue() ? '⚠️' : '📅';
  });
  readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);
}
