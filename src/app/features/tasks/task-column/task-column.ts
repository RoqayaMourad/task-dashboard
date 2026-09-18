import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { TaskCard } from '../task-card/task-card';

/** Dumb: one board column. Count badge reflects the live `tasks` input, never a hardcoded figure. */
@Component({
  selector: 'app-task-column',
  imports: [TaskCard],
  templateUrl: './task-column.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskColumn {
  readonly status = input.required<TaskStatus>();
  readonly label = input.required<string>();
  readonly tasks = input.required<Task[]>();
}
