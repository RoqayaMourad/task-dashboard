import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  OutputEmitterRef,
  signal,
  viewChild,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { isTaskOverdue } from '../../../core/models/overdue';
import { Task, TaskPriority } from '../../../core/models/task.model';
import { dueDateLabel } from '../due-date-label';

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  high: 'text-priority-high bg-priority-high-bg',
  medium: 'text-priority-medium bg-priority-medium-bg',
  low: 'text-priority-low bg-priority-low-bg',
};

export interface TaskActionEvent {
  task: Task;
  /** The card's own kebab button — never the popup menu item — so callers can restore focus to it. */
  trigger: HTMLElement;
}

/**
 * Dumb: renders a resolved `Task` and its kebab Edit/Delete affordance.
 * Emits intent only — `TaskBoardPage` decides what Edit/Delete actually do.
 */
@Component({
  selector: 'app-task-card',
  imports: [Menu],
  templateUrl: './task-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly mutationPending = input(false);

  readonly editRequested = output<TaskActionEvent>();
  readonly deleteRequested = output<TaskActionEvent>();

  readonly priorityClass = computed(() => PRIORITY_CLASS[this.task().priority]);
  readonly overdue = computed(() => isTaskOverdue(this.task()));
  readonly dueLabel = computed(() => dueDateLabel(this.task()));
  readonly metaIcon = computed(() => {
    if (this.task().status === 'done') return '✅';
    return this.overdue() ? '⚠️' : '📅';
  });
  readonly firstName = computed(() => this.task().assignee.name.split(' ')[0]);

  protected readonly menuId = computed(() => `task-menu-${this.task().id}`);
  protected readonly menuOpen = signal(false);
  protected readonly menuItems = computed<MenuItem[]>(() => {
    const disabled = this.mutationPending();
    return [
      { label: 'Edit', disabled, command: () => this.emitAction(this.editRequested) },
      { label: 'Delete', disabled, command: () => this.emitAction(this.deleteRequested) },
    ];
  });

  private readonly kebabButton = viewChild<ElementRef<HTMLButtonElement>>('kebabButton');
  private readonly menu = viewChild(Menu);

  protected onKebabClick(event: MouseEvent): void {
    this.menu()?.toggle(event);
  }

  private emitAction(emitter: OutputEmitterRef<TaskActionEvent>): void {
    const trigger = this.kebabButton()?.nativeElement;
    if (!trigger) {
      return;
    }
    emitter.emit({ task: this.task(), trigger });
  }
}
