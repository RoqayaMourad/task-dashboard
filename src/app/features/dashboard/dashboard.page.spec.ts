import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Statistic } from '../../core/models/statistic.model';
import { Task } from '../../core/models/task.model';
import { DashboardPage } from './dashboard.page';

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

    fixture.componentInstance.retryActivity();
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
});
