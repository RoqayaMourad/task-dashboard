import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  PRIORITY_COLOR_VARS,
  STATUS_COLOR_VARS,
  priorityDistribution,
  statusDistribution,
} from '../../core/models/task-distribution';
import { TaskStore } from '../../core/services/task.store';
import { TaskDistributionChart } from '../../shared/task-distribution-chart/task-distribution-chart';

/**
 * Smart/container. The fuller presentation of the same shared
 * priority/status distribution charts `DashboardPage` shows compactly —
 * same derivation, same chart component, not a second implementation.
 * Sources exclusively from `TaskStore.tasks()`, never `/api/statistics`.
 */
@Component({
  selector: 'app-analytics-page',
  imports: [TaskDistributionChart],
  templateUrl: './analytics.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsPage {
  private readonly taskStore = inject(TaskStore);

  readonly taskDataStatus = this.taskStore.status;
  readonly priorityData = computed(() => priorityDistribution(this.taskStore.tasks()));
  readonly statusData = computed(() => statusDistribution(this.taskStore.tasks()));
  readonly hasTasks = computed(() => this.taskStore.tasks().length > 0);

  protected readonly priorityColorVars = PRIORITY_COLOR_VARS;
  protected readonly statusColorVars = STATUS_COLOR_VARS;

  /** Same reasoning as Dashboard's charts skeleton: only while genuinely nothing has resolved yet. */
  readonly chartsSkeleton = computed(
    () =>
      this.taskDataStatus() === 'loading' ||
      (this.taskDataStatus() === 'reloading' && !this.hasTasks()),
  );

  retryTaskData(): void {
    this.taskStore.reload();
  }
}
