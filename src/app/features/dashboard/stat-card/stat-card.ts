import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChangeType, Statistic } from '../../../core/models/statistic.model';

const CHANGE_TYPE_CLASS: Record<ChangeType, string> = {
  positive: 'text-change-positive',
  negative: 'text-change-negative',
  neutral: 'text-change-neutral',
};

/** Dumb: renders a resolved `Statistic` only — no knowledge of where it came from. */
@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly statistic = input.required<Statistic>();

  readonly changeClass = computed(() => CHANGE_TYPE_CLASS[this.statistic().changeType]);
}
