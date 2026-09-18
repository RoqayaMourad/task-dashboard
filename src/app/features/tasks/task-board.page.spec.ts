import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Assignee, Task } from '../../core/models/task.model';
import { TaskStore } from '../../core/services/task.store';
import { TaskBoardPage } from './task-board.page';

function flushMacrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const assignee: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john@company.com',
};
const assignee2: Assignee = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah@company.com',
};

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    dueDate: '2099-01-01',
    assignee,
    tags: ['Design'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TaskBoardPage', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<TaskBoardPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(TaskBoardPage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushTasks(data: Task[]): Promise<void> {
    httpMock.expectOne('/api/tasks').flush(data);
    await flushMacrotask();
  }

  async function flushUsers(data: Assignee[] = [assignee, assignee2]): Promise<void> {
    httpMock.expectOne('/api/users').flush(data);
    await flushMacrotask();
  }

  async function failTasks(): Promise<void> {
    httpMock.expectOne('/api/tasks').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
  }

  async function failUsers(): Promise<void> {
    httpMock.expectOne('/api/users').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
  }

  it('renders one card per task placed in its status column', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([
      fixtureTask({ id: 't-1', status: 'todo' }),
      fixtureTask({ id: 't-2', status: 'done' }),
    ]);
    await flushUsers();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(2);
  });

  it('shows board skeletons while tasks are initially loading, then real content', async () => {
    fixture.detectChanges();
    await flushMacrotask();

    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    await flushTasks([fixtureTask()]);
    await flushUsers();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(0);
  });

  it('shows an error and retry action when the task read fails, and retry reloads tasks', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await failTasks();
    await flushUsers();
    fixture.detectChanges();

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Retry loading tasks"]',
    );
    expect(retryButton).toBeTruthy();

    retryButton.click();
    await flushMacrotask();
    await flushTasks([fixtureTask()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
  });

  it('filters the board by status through TaskStore', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([
      fixtureTask({ id: 't-1', status: 'todo' }),
      fixtureTask({ id: 't-2', status: 'done' }),
    ]);
    await flushUsers();
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const doneButton = buttons.find((b) => b.textContent?.trim() === 'Done')!;
    doneButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
  });

  it('passes resolved assignee options and status down to the filters bar', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([fixtureTask()]);
    await flushUsers();
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#assignee-filter');
    expect(select.disabled).toBe(false);
    expect(select.textContent).toContain('Sarah Smith');
  });

  it('disables the assignee filter independently when UserService fails, without hiding a successful board', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([fixtureTask()]);
    await failUsers();
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#assignee-filter');
    expect(select.disabled).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
  });

  it('filters the board by title/description when setSearchTerm() updates TaskStore', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([
      fixtureTask({ id: 't-1', title: 'Design homepage', description: 'Create wireframes' }),
      fixtureTask({ id: 't-2', title: 'Fix login bug', description: 'Session token expires' }),
    ]);
    await flushUsers();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(2);

    fixture.componentInstance.setSearchTerm('wireframes');
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-task-card');
    expect(cards.length).toBe(1);
    expect(TestBed.inject(TaskStore).searchTerm()).toBe('wireframes');
  });

  it('resets only TaskStore.searchTerm on destroy', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([fixtureTask()]);
    await flushUsers();
    fixture.detectChanges();

    const taskStore = TestBed.inject(TaskStore);
    fixture.componentInstance.setSearchTerm('homepage');
    taskStore.statusFilter.set('done');
    expect(taskStore.searchTerm()).toBe('homepage');

    fixture.destroy();

    expect(taskStore.searchTerm()).toBe('');
    expect(taskStore.statusFilter()).toBe('done');
  });
});
