import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { DistributionSlice } from '../../core/models/task-distribution';

// Modular registration (not `chart.js/auto`) — only what a bar and a
// doughnut chart with tooltips/legend actually need, kept minimal on purpose.
Chart.register(
  BarController,
  DoughnutController,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

interface ChartDataset {
  labels: string[];
  data: number[];
  backgroundColor: string[];
}

/** Pure — no DOM/canvas involved, so it's directly unit-testable. */
export function mapToChartDataset(
  slices: readonly DistributionSlice<string>[],
  colorForKey: (key: string) => string,
): ChartDataset {
  return {
    labels: slices.map((slice) => slice.label),
    data: slices.map((slice) => slice.count),
    backgroundColor: slices.map((slice) => colorForKey(slice.key)),
  };
}

/**
 * Dumb: the only place in the app that touches Chart.js. Renders one
 * bar/doughnut chart from a `DistributionSlice[]`, plus an always-present
 * accessible text breakdown of the same data — a `<canvas>` has no inherent
 * accessible content, so the breakdown (not the `aria-label` alone) is the
 * real fallback. `compact` only toggles CSS (`sr-only` the breakdown, hide
 * the built-in legend) — no collapse/expand interaction, no separate
 * implementation per caller.
 *
 * Colors are read from the app's existing CSS custom properties
 * (`--color-priority-*`/`--color-status-*` in styles.css) via
 * `getComputedStyle`, not duplicated as a second hex table.
 */
@Component({
  selector: 'app-task-distribution-chart',
  templateUrl: './task-distribution-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDistributionChart implements OnDestroy {
  readonly type = input.required<'bar' | 'doughnut'>();
  readonly data = input.required<DistributionSlice<string>[]>();
  readonly ariaLabel = input.required<string>();
  /** Maps each slice's `key` to the CSS custom property name holding its color (e.g. `{ high: '--color-priority-high' }`). */
  readonly colorVars = input.required<Record<string, string>>();
  /** Hides the built-in legend and `sr-only`-hides the text breakdown — Dashboard's compact presentation. */
  readonly compact = input(false);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | undefined;

  protected readonly dataset = () =>
    mapToChartDataset(this.data(), (key) => this.resolveColor(this.colorVars()[key]));

  constructor() {
    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      if (!canvas) {
        return;
      }
      const config = this.buildConfig();
      this.chart?.destroy();
      this.chart = new Chart(canvas, config);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private resolveColor(varName: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  private buildConfig():
    ChartConfiguration<'bar', number[], string> | ChartConfiguration<'doughnut', number[], string> {
    const { labels, data, backgroundColor } = this.dataset();
    const type = this.type();
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: this.showLegend(type) } },
    };

    if (type === 'bar') {
      return {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor }] },
        options: {
          ...commonOptions,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      };
    }

    return {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor }] },
      options: commonOptions,
    };
  }

  /**
   * Chart.js's default bar legend shows one entry per *dataset*, not per
   * category — and this chart never sets a dataset `label`, so that entry
   * renders as the literal text "undefined". The categories are already
   * conveyed by the chart title and the accessible breakdown list, so a bar
   * chart never shows a legend (inventing a dataset label just to populate
   * one would add a meaningless entry, not fix the real problem). Doughnut's
   * default legend is per-slice and genuinely useful, so it still follows
   * `compact`.
   */
  private showLegend(type: 'bar' | 'doughnut'): boolean {
    return type === 'doughnut' && !this.compact();
  }
}
