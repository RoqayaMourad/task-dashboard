import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DistributionSlice } from '../../core/models/task-distribution';
import { mapToChartDataset, TaskDistributionChart } from './task-distribution-chart';

// jsdom has no real canvas 2D context, so Chart.js itself can't be
// meaningfully exercised in unit tests — this mocks the library boundary
// and tests our own integration (what we construct it with, that we
// destroy it) rather than any canvas rendering, per the "don't test
// canvas internals" constraint.
//
// Assertions read the constructed instance off the component's own `chart`
// property (private, accessed via a type-safe cast), not off a spec-level
// reference to the mocked `Chart` import. On this project's CI runner
// (Linux/Node 22, not reproducible on Windows), the component's `chart.js`
// import and this spec's own `chart.js` import resolved to two distinct
// evaluations of the `vi.mock` factory — confirmed by direct logging: the
// component reliably constructed a "MockChart" instance on every render,
// while a spec-side `vi.mocked(Chart).mock.instances` (or an even earlier
// closure variable set from inside the factory) stayed empty/undefined.
// Reading the instance the component itself holds sidesteps that entirely —
// it doesn't depend on which module evaluation produced it.
interface MockChartInstance {
  canvas: unknown;
  config: unknown;
  destroy: ReturnType<typeof vi.fn>;
}

interface ComponentWithChart {
  chart?: MockChartInstance;
}

vi.mock('chart.js', () => {
  class MockChart {
    static register = vi.fn();
    destroy = vi.fn();
    constructor(
      public canvas: unknown,
      public config: unknown,
    ) {}
  }
  return {
    Chart: MockChart,
    BarController: {},
    DoughnutController: {},
    BarElement: {},
    ArcElement: {},
    CategoryScale: {},
    LinearScale: {},
    Tooltip: {},
    Legend: {},
  };
});

function chartOf(fixture: ComponentFixture<TaskDistributionChart>): MockChartInstance {
  const instance = (fixture.componentInstance as unknown as ComponentWithChart).chart;
  if (!instance) {
    throw new Error('Expected TaskDistributionChart to have constructed a chart by now');
  }
  return instance;
}

describe('mapToChartDataset', () => {
  const slices: DistributionSlice<string>[] = [
    { key: 'high', label: 'High', count: 2, percentage: 50 },
    { key: 'low', label: 'Low', count: 2, percentage: 50 },
  ];

  it('maps slices to Chart.js labels/data/backgroundColor arrays using the given color lookup', () => {
    const result = mapToChartDataset(slices, (key) => `color-${key}`);

    expect(result).toEqual({
      labels: ['High', 'Low'],
      data: [2, 2],
      backgroundColor: ['color-high', 'color-low'],
    });
  });

  it('returns empty arrays for an empty slice list', () => {
    expect(mapToChartDataset([], (key) => key)).toEqual({
      labels: [],
      data: [],
      backgroundColor: [],
    });
  });
});

describe('TaskDistributionChart', () => {
  const data: DistributionSlice<string>[] = [
    { key: 'high', label: 'High', count: 3, percentage: 75 },
    { key: 'low', label: 'Low', count: 1, percentage: 25 },
  ];

  // `TaskDistributionChart` constructs its Chart.js instance inside
  // `afterRenderEffect`. That hook is registered by `detectChanges()` but
  // actually runs via `AfterRenderManager`, invoked from `ApplicationRef.tick()`
  // — not from a component-level `detectChanges()` call, and deliberately
  // outside the Angular zone (so `whenStable()` doesn't wait for it either).
  // `TestBed.tick()` (`flushEffects()`) drives that `ApplicationRef.tick()`
  // directly, which is the documented way to flush a pending render effect.
  function createComponent(
    overrides: {
      type?: 'bar' | 'doughnut';
      compact?: boolean;
    } = {},
  ) {
    const fixture = TestBed.createComponent(TaskDistributionChart);
    fixture.componentRef.setInput('type', overrides.type ?? 'bar');
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('ariaLabel', 'Tasks by priority');
    fixture.componentRef.setInput('colorVars', { high: '--test-high', low: '--test-low' });
    fixture.componentRef.setInput('compact', overrides.compact ?? false);
    fixture.detectChanges();
    TestBed.tick();
    return fixture;
  }

  it('labels the canvas for assistive tech', () => {
    const fixture = createComponent();
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');

    expect(canvas.getAttribute('aria-label')).toBe('Tasks by priority');
    expect(canvas.getAttribute('role')).toBe('img');
  });

  it('constructs a Chart.js chart with the given type and mapped data', () => {
    const fixture = createComponent({ type: 'doughnut' });

    expect(chartOf(fixture).config).toMatchObject({
      type: 'doughnut',
      data: {
        labels: ['High', 'Low'],
        datasets: [{ data: [3, 1] }],
      },
    });
  });

  it('shows a visible breakdown when not compact', () => {
    const fixture = createComponent({ compact: false });
    const list: HTMLElement = fixture.nativeElement.querySelector('ul');
    expect(list.classList.contains('sr-only')).toBe(false);
  });

  it('sr-only-hides the breakdown when compact', () => {
    const fixture = createComponent({ compact: true });
    const list: HTMLElement = fixture.nativeElement.querySelector('ul');
    expect(list.classList.contains('sr-only')).toBe(true);
  });

  describe('legend visibility', () => {
    interface LegendConfig {
      display: boolean;
      labels?: { boxWidth: number; padding: number; font: { size: number } };
    }

    function legendConfig(fixture: ComponentFixture<TaskDistributionChart>): LegendConfig {
      return (chartOf(fixture).config as { options: { plugins: { legend: LegendConfig } } }).options
        .plugins.legend;
    }

    it('never shows a legend for the bar chart (Priority) — Chart.js would otherwise render a stray "undefined" dataset-label entry, since this chart never sets one', () => {
      const fixture = createComponent({ type: 'bar', compact: false });
      expect(legendConfig(fixture).display).toBe(false);
    });

    it('keeps the bar legend hidden when compact too', () => {
      const fixture = createComponent({ type: 'bar', compact: true });
      expect(legendConfig(fixture).display).toBe(false);
    });

    it('shows the legend for the doughnut chart (Status) when not compact, at full size', () => {
      const fixture = createComponent({ type: 'doughnut', compact: false });
      expect(legendConfig(fixture).display).toBe(true);
      expect(legendConfig(fixture).labels).toBeUndefined();
    });

    it('keeps the doughnut legend visible when compact, shrunk to fit — Dashboard has no other visible color key since its breakdown is sr-only', () => {
      const fixture = createComponent({ type: 'doughnut', compact: true });
      expect(legendConfig(fixture).display).toBe(true);
      expect(legendConfig(fixture).labels).toEqual({ boxWidth: 8, padding: 6, font: { size: 10 } });
    });
  });

  it('scopes the chart height to the canvas wrapper only, never to the host, so the visible breakdown is never height-clipped', () => {
    const fixture = createComponent({ compact: false });
    const root: HTMLElement = fixture.nativeElement;
    const canvas = root.querySelector('canvas') as HTMLCanvasElement;
    const chartWrapper = canvas.parentElement as HTMLElement;
    const list = root.querySelector('ul') as HTMLElement;

    expect(chartWrapper.classList.contains('h-64')).toBe(true);
    expect(root.classList.contains('h-64')).toBe(false);
    expect(chartWrapper.contains(list)).toBe(false);
  });

  it('renders an accessible text breakdown matching the given data, in both modes', () => {
    const fixture = createComponent();
    const text = fixture.nativeElement.querySelector('ul').textContent as string;

    expect(text).toContain('High: 3 tasks (75%)');
    expect(text).toContain('Low: 1 task (25%)');
  });

  it('destroys the chart on component destroy', () => {
    const fixture = createComponent();
    const instance = chartOf(fixture);
    fixture.destroy();

    expect(instance.destroy).toHaveBeenCalled();
  });

  it(
    'recreates the chart, destroying the previous instance, when a reactive input changes ' +
      'after the initial render — guards the effect()→afterRenderEffect migration: chart ' +
      'creation must stay tied to every render in which its signal inputs are dirty, not just ' +
      'the very first one',
    () => {
      const fixture = createComponent({ type: 'doughnut', compact: false });
      const initialInstance = chartOf(fixture);

      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
      TestBed.tick();

      const recreatedInstance = chartOf(fixture);
      expect(initialInstance.destroy).toHaveBeenCalledTimes(1);
      expect(recreatedInstance).not.toBe(initialInstance);
      expect(
        (recreatedInstance.config as { options: { plugins: { legend: { labels?: unknown } } } })
          .options.plugins.legend.labels,
      ).toEqual({ boxWidth: 8, padding: 6, font: { size: 10 } });
    },
  );
});
