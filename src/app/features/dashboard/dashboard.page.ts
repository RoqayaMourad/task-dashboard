import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-page',
  template: `
    <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
    <p class="mt-2 text-sm text-slate-500">
      Stat cards, charts, and the activity feed arrive in Phase 12.
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {}
