import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task } from '../../core/models/task.model';
import { AnalyticsPage } from './analytics.page';

// jsdom has no real canvas 2D context. Mock the Chart.js boundary. See
// shared/task-distribution-chart/task-distribution-chart.spec.ts for the
// chart component's own dedicated tests.
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

const assignee = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john@company.com' };

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-09-25',
    assignee,
    tags: [],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AnalyticsPage', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<AnalyticsPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AnalyticsPage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushTasks(data: Task[]): Promise<void> {
    httpMock.expectOne('/api/tasks').flush(data);
    await flushMacrotask();
  }

  async function failTasks(): Promise<void> {
    httpMock.expectOne('/api/tasks').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
  }

  function skeletonCount(): number {
    return fixture.nativeElement.querySelectorAll('.animate-pulse').length;
  }

  it('shows a skeleton while tasks are loading', async () => {
    fixture.detectChanges();
    await flushMacrotask();

    expect(skeletonCount()).toBeGreaterThan(0);

    await flushTasks([fixtureTask()]);
  });

  it('renders both charts once tasks resolve', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([fixtureTask({ priority: 'high' }), fixtureTask({ priority: 'low' })]);
    fixture.detectChanges();

    expect(skeletonCount()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('app-task-distribution-chart').length).toBe(2);
  });

  it('shows an error with retry on failure, and recovers after retry', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await failTasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Retry loading task distribution charts"]',
    );
    retryButton.click();
    await flushMacrotask();

    await flushTasks([fixtureTask()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-distribution-chart').length).toBe(2);
  });

  it('shows an empty-state message instead of all-zero charts when there are no tasks', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tasks yet');
    expect(fixture.nativeElement.querySelectorAll('app-task-distribution-chart').length).toBe(0);
  });

  it('renders the breakdown visibly (not sr-only), unlike Dashboard’s compact presentation', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([fixtureTask()]);
    fixture.detectChanges();

    const breakdowns: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('app-task-distribution-chart ul'),
    );
    expect(breakdowns.length).toBe(2);
    expect(breakdowns.every((ul) => ul.classList.contains('sr-only'))).toBe(false);
  });
});
