import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calendar-page',
  template: `
    <h1 class="text-2xl font-bold text-text-heading">Calendar</h1>
    <p class="mt-2 text-sm text-text-muted">
      No functionality is specified for this page in the assignment — it stays a placeholder.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {}
