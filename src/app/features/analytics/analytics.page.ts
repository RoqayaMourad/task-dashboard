import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-analytics-page',
  template: `
    <h1 class="text-2xl font-bold text-slate-900">Analytics</h1>
    <p class="mt-2 text-sm text-slate-500">
      Priority/status distribution charts arrive in Phase 15.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {}
