import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { StatisticsService } from '../../core/services/statistics.service';
import { TaskStore } from '../../core/services/task.store';
import { deriveRecentActivity } from './activity';
import { ActivityFeed } from './activity-feed/activity-feed';
import { StatCard } from './stat-card/stat-card';

const RECENT_ACTIVITY_LIMIT = 5;

/**
 * Smart/container. Statistics and Recent Activity come from two independent
 * `httpResource`s (`StatisticsService`, `TaskStore`) and are never collapsed
 * into one page-wide loading/error state — each section renders, fails, and
 * retries on its own.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [StatCard, ActivityFeed],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly statisticsService = inject(StatisticsService);
  private readonly taskStore = inject(TaskStore);

  readonly statisticsStatus = this.statisticsService.statistics.status;
  readonly statistics = this.statisticsService.statistics.value;

  readonly activityStatus = this.taskStore.status;
  readonly recentActivity = computed(() =>
    deriveRecentActivity(this.taskStore.tasks(), RECENT_ACTIVITY_LIMIT),
  );

  /**
   * `status() === 'reloading'` covers two different situations the resource
   * API doesn't distinguish by itself: retrying from a resolved state (real
   * data is still in `value()`, keep showing it) and retrying from a state
   * that never resolved (`value()` is the empty `defaultValue`, nothing
   * usable exists yet). Only the second case still needs a skeleton.
   */
  readonly statisticsSkeleton = computed(
    () =>
      this.statisticsStatus() === 'loading' ||
      (this.statisticsStatus() === 'reloading' && this.statistics().length === 0),
  );
  readonly activitySkeleton = computed(
    () =>
      this.activityStatus() === 'loading' ||
      (this.activityStatus() === 'reloading' && this.recentActivity().length === 0),
  );

  retryStatistics(): void {
    this.statisticsService.statistics.reload();
  }

  retryActivity(): void {
    this.taskStore.reload();
  }
}
