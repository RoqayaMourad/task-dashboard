import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-team-page',
  template: `
    <h1 class="text-2xl font-bold text-slate-900">Team</h1>
    <p class="mt-2 text-sm text-slate-500">The user grid arrives in Phase 16.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {}
