import { TestBed } from '@angular/core/testing';
import { DistributionSlice } from '../../core/models/task-distribution';
import { mapToChartDataset, TaskDistributionChart } from './task-distribution-chart';

// jsdom has no real canvas 2D context, so Chart.js itself can't be
// meaningfully exercised in unit tests — this mocks the library boundary
// and tests our own integration (what we construct it with, that we
// destroy it) rather than any canvas rendering, per the "don't test
// canvas internals" constraint.
const destroySpy = vi.fn();
let lastConfig: unknown;

vi.mock('chart.js', () => {
  class MockChart {
    static register = vi.fn();
    destroy = destroySpy;
    constructor(
      public canvas: unknown,
      public config: unknown,
    ) {
      lastConfig = config;
    }
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
    return fixture;
  }

  beforeEach(() => {
    destroySpy.mockClear();
    lastConfig = undefined;
  });

  it('labels the canvas for assistive tech', () => {
    const fixture = createComponent();
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');

    expect(canvas.getAttribute('aria-label')).toBe('Tasks by priority');
    expect(canvas.getAttribute('role')).toBe('img');
  });

  it('constructs a Chart.js chart with the given type and mapped data', () => {
    createComponent({ type: 'doughnut' });

    expect(lastConfig).toMatchObject({
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
    function legendDisplay(): boolean {
      return (lastConfig as { options: { plugins: { legend: { display: boolean } } } }).options
        .plugins.legend.display;
    }

    it('never shows a legend for the bar chart (Priority) — Chart.js would otherwise render a stray "undefined" dataset-label entry, since this chart never sets one', () => {
      createComponent({ type: 'bar', compact: false });
      expect(legendDisplay()).toBe(false);
    });

    it('keeps the bar legend hidden when compact too', () => {
      createComponent({ type: 'bar', compact: true });
      expect(legendDisplay()).toBe(false);
    });

    it('shows the legend for the doughnut chart (Status) when not compact', () => {
      createComponent({ type: 'doughnut', compact: false });
      expect(legendDisplay()).toBe(true);
    });

    it('hides the doughnut legend when compact', () => {
      createComponent({ type: 'doughnut', compact: true });
      expect(legendDisplay()).toBe(false);
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
    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});
