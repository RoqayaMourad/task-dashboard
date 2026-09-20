import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { TaskActionEvent, TaskCard } from '../task-card/task-card';

/**
 * Dumb: one board column. Count badge reflects the live `tasks` input, never
 * a hardcoded figure. `cdkDropListData` carries this column's own
 * `TaskStatus`, never a string id, so `TaskBoardPage` decides what a drop
 * means from typed CDK data, not by parsing a DOM identifier. This column
 * only relays the raw `CdkDragDrop` event upward; it has no `TaskStore`
 * access and makes no mutation decision itself.
 */
@Component({
  selector: 'app-task-column',
  imports: [TaskCard, CdkDropList, CdkDrag],
  templateUrl: './task-column.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskColumn {
  readonly status = input.required<TaskStatus>();
  readonly label = input.required<string>();
  readonly tasks = input.required<Task[]>();
  readonly mutationPending = input(false);

  readonly editRequested = output<TaskActionEvent>();
  readonly deleteRequested = output<TaskActionEvent>();
  readonly cardDropped = output<CdkDragDrop<TaskStatus, TaskStatus, Task>>();

  protected onDropped(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    this.cardDropped.emit(event);
  }
}
