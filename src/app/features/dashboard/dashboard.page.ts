import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  PRIORITY_COLOR_VARS,
  STATUS_COLOR_VARS,
  priorityDistribution,
  statusDistribution,
} from '../../core/models/task-distribution';
import { StatisticsService } from '../../core/services/statistics.service';
import { TaskStore } from '../../core/services/task.store';
import { TaskDistributionChart } from '../../shared/task-distribution-chart/task-distribution-chart';
import { deriveRecentActivity } from './activity';
import { ActivityFeed } from './activity-feed/activity-feed';
import { StatCard } from './stat-card/stat-card';

const RECENT_ACTIVITY_LIMIT = 5;

/**
 * Smart/container. Statistics is one independent `httpResource`
 * (`StatisticsService`); Recent Activity and the distribution charts are
 * two presentations of the *same* `TaskStore` resource, not independent
 * ones; they share one loading/error/retry state (`taskDataStatus`/
 * `retryTaskData`) since retrying one re-fetches what both need. Neither
 * resource is ever collapsed into a single page-wide state: each of the
 * two groups renders, fails, and retries on its own.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [StatCard, ActivityFeed, TaskDistributionChart],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly statisticsService = inject(StatisticsService);
  private readonly taskStore = inject(TaskStore);

  readonly statisticsStatus = this.statisticsService.statistics.status;
  readonly statistics = this.statisticsService.statistics.value;

  readonly taskDataStatus = this.taskStore.status;
  readonly recentActivity = computed(() =>
    deriveRecentActivity(this.taskStore.tasks(), RECENT_ACTIVITY_LIMIT),
  );
  readonly priorityData = computed(() => priorityDistribution(this.taskStore.tasks()));
  readonly statusData = computed(() => statusDistribution(this.taskStore.tasks()));
  readonly hasTasks = computed(() => this.taskStore.tasks().length > 0);

  protected readonly priorityColorVars = PRIORITY_COLOR_VARS;
  protected readonly statusColorVars = STATUS_COLOR_VARS;

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
      this.taskDataStatus() === 'loading' ||
      (this.taskDataStatus() === 'reloading' && this.recentActivity().length === 0),
  );
  readonly chartsSkeleton = computed(
    () =>
      this.taskDataStatus() === 'loading' ||
      (this.taskDataStatus() === 'reloading' && !this.hasTasks()),
  );

  retryStatistics(): void {
    this.statisticsService.statistics.reload();
  }

  retryTaskData(): void {
    this.taskStore.reload();
  }
}
