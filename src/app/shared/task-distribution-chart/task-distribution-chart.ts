import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
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
 * real fallback. `compact` `sr-only`-hides the text breakdown and shrinks
 * the doughnut's built-in legend (Dashboard's only visible color key for
 * Status, since its breakdown is `sr-only` there) — no collapse/expand
 * interaction, no separate implementation per caller.
 *
 * Colors are read from the app's existing CSS custom properties
 * (`--color-priority-*`/`--color-status-*` in styles.css) via
 * `getComputedStyle`, not duplicated as a second hex table.
 *
 * The height a caller passes (`chartHeightClass`) is scoped to the canvas
 * wrapper only, never to the host — the host sizes naturally to canvas +
 * breakdown, so the visible breakdown (non-compact mode) is never clipped
 * or pushed outside a fixed-height ancestor.
 */
@Component({
  selector: 'app-task-distribution-chart',
  templateUrl: './task-distribution-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class TaskDistributionChart implements OnDestroy {
  readonly type = input.required<'bar' | 'doughnut'>();
  readonly data = input.required<DistributionSlice<string>[]>();
  readonly ariaLabel = input.required<string>();
  /** Maps each slice's `key` to the CSS custom property name holding its color (e.g. `{ high: '--color-priority-high' }`). */
  readonly colorVars = input.required<Record<string, string>>();
  /** `sr-only`-hides the text breakdown and shrinks the doughnut's built-in legend — Dashboard's compact presentation. */
  readonly compact = input(false);
  /** Tailwind height utility applied to the canvas wrapper only (e.g. `h-32` compact, `h-64` full) — see class doc above. */
  readonly chartHeightClass = input('h-64');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | undefined;

  protected readonly dataset = () =>
    mapToChartDataset(this.data(), (key) => this.resolveColor(this.colorVars()[key]));

  constructor() {
    // Chart.js reads the canvas's container box (and, via the legend plugin,
    // measures text) at construction time, so it must run once Angular has
    // actually committed a stable layout — not merely once the canvas exists
    // in the DOM. A plain `effect()` can fire mid-render, before the browser
    // has a final box to measure, leaving Chart.js's initial legend layout
    // wrong until something (e.g. a later interaction-triggered internal
    // resize) forces it to recompute. `afterRenderEffect` defers this same
    // reactive construction to Angular's post-render `mixedReadWrite` phase,
    // which guarantees the DOM is render-stable first.
    afterRenderEffect(() => {
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
      plugins: { legend: this.legendOptions(type) },
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
   * would render as the literal text "undefined". The categories are already
   * conveyed by the chart title and the accessible breakdown list, so a bar
   * chart never shows a legend (inventing a dataset label just to populate
   * one would add a meaningless entry, not fix the real problem).
   *
   * Doughnut's default legend is per-slice and is Dashboard's only visible
   * color key for Status (its text breakdown is `sr-only` there), so it
   * always shows — `compact` only shrinks its markers/font to fit the
   * smaller card, it never hides it.
   */
  private legendOptions(type: 'bar' | 'doughnut'): {
    display: boolean;
    position: 'bottom';
    labels?: { boxWidth: number; padding: number; font: { size: number } };
  } {
    return {
      display: type === 'doughnut',
      position: 'bottom',
      labels: this.compact() ? { boxWidth: 8, padding: 6, font: { size: 10 } } : undefined,
    };
  }
}
