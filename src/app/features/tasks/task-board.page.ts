import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-task-board-page',
  template: `
    <h1 class="text-2xl font-bold text-slate-900">Tasks</h1>
    <p class="mt-2 text-sm text-slate-500">
      The Kanban board, filters, search, and task CRUD arrive in Phase 13.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardPage {}
