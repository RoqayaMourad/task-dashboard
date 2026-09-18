import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityItem } from '../activity';

/**
 * Dumb, resolved-state only: renders whatever `ActivityItem[]` it's given.
 * Has no idea `TaskStore`/`httpResource` exist — loading/error/retry are
 * `DashboardPage`'s job.
 */
@Component({
  selector: 'app-activity-feed',
  imports: [DatePipe],
  templateUrl: './activity-feed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeed {
  readonly items = input.required<ActivityItem[]>();
}
