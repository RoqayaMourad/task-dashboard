import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center gap-3 py-16 text-center">
      <h1 class="text-2xl font-bold text-slate-900">Page not found</h1>
      <p class="text-sm text-slate-500">The page you're looking for doesn't exist.</p>
      <a routerLink="/dashboard" class="text-sm font-semibold text-primary hover:underline">
        Back to Dashboard
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
