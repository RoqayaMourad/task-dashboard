import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-calendar-page',
  template: `
    <h1 class="text-2xl font-bold text-text-heading">Calendar</h1>
    <p class="mt-2 text-sm text-text-muted">Coming soon.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {}
