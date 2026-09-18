import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calendar-page',
  template: `
    <h1 class="text-2xl font-bold text-slate-900">Calendar</h1>
    <p class="mt-2 text-sm text-slate-500">
      No functionality is specified for this page in the assignment — it stays a placeholder.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {}
