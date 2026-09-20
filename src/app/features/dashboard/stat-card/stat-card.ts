import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChangeType, Statistic } from '../../../core/models/statistic.model';

/**
 * `positive` uses the `-text` variant, not plain `--color-change-positive`;
 * see styles.css: the raw hue fails WCAG AA at this text-xs size on white.
 * `negative`/`neutral` already pass and are untouched.
 */
const CHANGE_TYPE_CLASS: Record<ChangeType, string> = {
  positive: 'text-change-positive-text',
  negative: 'text-change-negative',
  neutral: 'text-change-neutral',
};

/** Dumb: renders a resolved `Statistic` only, no knowledge of where it came from. */
@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly statistic = input.required<Statistic>();

  readonly changeClass = computed(() => CHANGE_TYPE_CLASS[this.statistic().changeType]);
}
