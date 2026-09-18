import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Statistic } from '../../core/models/statistic.model';
import { Task } from '../../core/models/task.model';
import { DashboardPage } from './dashboard.page';

// jsdom has no real canvas 2D context — mock the Chart.js boundary so the
// distribution charts render without exercising canvas internals. See
// shared/task-distribution-chart/task-distribution-chart.spec.ts for the
// component's own dedicated tests.
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

function flushMacrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const assignee = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' };

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-09-20',
    assignee,
    tags: ['Design'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

const statisticsFixture: Statistic[] = [
  {
    id: 'stat-001',
    title: 'Total Tasks',
    icon: '📊',
    value: 156,
    change: '+12',
    changeLabel: 'this week',
    changeType: 'positive',
    color: '#1976D2',
  },
];

describe('DashboardPage', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(DashboardPage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushStatistics(data: Statistic[] = statisticsFixture): Promise<void> {
    httpMock.expectOne('/api/statistics').flush(data);
    await flushMacrotask();
  }

  async function flushTasks(data: Task[] = [fixtureTask()]): Promise<void> {
    httpMock.expectOne('/api/tasks').flush(data);
    await flushMacrotask();
  }

  async function failStatistics(): Promise<void> {
    httpMock
      .expectOne('/api/statistics')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
  }

  async function failTasks(): Promise<void> {
    httpMock.expectOne('/api/tasks').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
  }

  function statsAlert(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      'section[aria-labelledby="stats-heading"] [role="alert"]',
    );
  }

  function statsSkeletonCount(): number {
    return fixture.nativeElement.querySelectorAll(
      'section[aria-labelledby="stats-heading"] .animate-pulse',
    ).length;
  }

  function activitySkeletonCount(): number {
    return fixture.nativeElement.querySelectorAll(
      'section[aria-labelledby="activity-heading"] .animate-pulse',
    ).length;
  }

  it('renders both sections once statistics and activity resolve', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await flushTasks();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('156');
    expect(text).toContain('Design homepage');
    expect(statsSkeletonCount()).toBe(0);
    expect(activitySkeletonCount()).toBe(0);
  });

  it('renders resolved activity while statistics are still loading', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Design homepage');
    expect(statsSkeletonCount()).toBeGreaterThan(0);

    await flushStatistics();
  });

  it('renders resolved statistics while activity is still loading', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('156');
    expect(activitySkeletonCount()).toBeGreaterThan(0);

    await flushTasks();
  });

  it('shows a statistics error without hiding successfully-loaded activity', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await failStatistics();
    await flushTasks();
    fixture.detectChanges();

    expect(statsAlert()).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Design homepage');
  });

  it('shows an activity error without hiding successfully-loaded statistics', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await failTasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('156');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Retry loading recent activity"]'),
    ).toBeTruthy();
  });

  it('shows independent errors for both sections when both fail', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await failStatistics();
    await failTasks();
    fixture.detectChanges();

    expect(statsAlert()).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[aria-label="Retry loading recent activity"]'),
    ).toBeTruthy();
  });

  it('retries only the statistics resource on statistics retry', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await failStatistics();
    await flushTasks();
    fixture.detectChanges();

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Retry loading statistics"]',
    );
    retryButton.click();
    await flushMacrotask();

    await flushStatistics();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('156');
  });

  it('retries only the activity/tasks resource on activity retry', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await failTasks();
    fixture.detectChanges();

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Retry loading recent activity"]',
    );
    retryButton.click();
    await flushMacrotask();

    await flushTasks();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Design homepage');
  });

  it('keeps showing previously-resolved activity while reloading, instead of a skeleton', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await flushTasks();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Design homepage');

    fixture.componentInstance.retryTaskData();
    await flushMacrotask();
    fixture.detectChanges();

    expect(activitySkeletonCount()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Design homepage');

    await flushTasks();
  });

  it('shows an empty-activity message once resolved with no tasks', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await flushTasks([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No recent activity');
  });

  function chartsSkeletonCount(): number {
    return fixture.nativeElement.querySelectorAll(
      'section[aria-labelledby="charts-heading"] .animate-pulse',
    ).length;
  }

  it('shows a charts skeleton while tasks are loading, then both charts once resolved', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    fixture.detectChanges();

    expect(chartsSkeletonCount()).toBeGreaterThan(0);

    await flushTasks([fixtureTask({ priority: 'high' }), fixtureTask({ priority: 'low' })]);
    fixture.detectChanges();

    expect(chartsSkeletonCount()).toBe(0);
    const charts = fixture.nativeElement.querySelectorAll('app-task-distribution-chart');
    expect(charts.length).toBe(2);
  });

  it('shows a charts error with retry, sharing the same retry as Recent Activity', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await failTasks();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector(
      'section[aria-labelledby="charts-heading"] [role="alert"]',
    );
    expect(alert).toBeTruthy();

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Retry loading task distribution charts"]',
    );
    retryButton.click();
    await flushMacrotask();

    await flushTasks([fixtureTask()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-distribution-chart').length).toBe(2);
  });

  it('shows an empty-charts message instead of all-zero charts when there are no tasks', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await flushTasks([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tasks yet');
    expect(fixture.nativeElement.querySelectorAll('app-task-distribution-chart').length).toBe(0);
  });

  it('keeps the distribution charts compact (sr-only text breakdown, per the accessibility refinement)', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushStatistics();
    await flushTasks([fixtureTask()]);
    fixture.detectChanges();

    const breakdowns: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('app-task-distribution-chart ul'),
    );
    expect(breakdowns.length).toBe(2);
    expect(breakdowns.every((ul) => ul.classList.contains('sr-only'))).toBe(true);
  });
});
