import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { Task } from '../models/task.model';
import { HttpCache } from '../http/http-cache';
import { cacheInterceptor } from '../http/cache.interceptor';
import { TaskStore } from './task.store';

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

describe('TaskStore', () => {
  let httpMock: HttpTestingController;
  let store: TaskStore;

  async function setupWithInitialTasks(tasks: Task[]): Promise<void> {
    await flushMacrotask();
    httpMock.expectOne('/api/tasks').flush(tasks);
    await flushMacrotask();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TaskStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads tasks from GET /api/tasks on creation', async () => {
    await setupWithInitialTasks([fixtureTask()]);
    expect(store.tasks().map((t) => t.id)).toEqual(['task-001']);
    expect(store.filteredTasks().map((t) => t.id)).toEqual(['task-001']);
  });

  it('applies status/priority/assignee filters and search through to filteredTasks', async () => {
    await setupWithInitialTasks([
      fixtureTask({ id: 't-1', status: 'todo', title: 'Design homepage' }),
      fixtureTask({
        id: 't-2',
        status: 'done',
        title: 'Ship release',
        assignee: { ...assignee, id: 'user-002' },
      }),
    ]);

    store.statusFilter.set('done');
    expect(store.filteredTasks().map((t) => t.id)).toEqual(['t-2']);

    store.statusFilter.set('all');
    store.assigneeFilter.set('user-002');
    expect(store.filteredTasks().map((t) => t.id)).toEqual(['t-2']);

    store.assigneeFilter.set('all');
    store.searchTerm.set('homepage');
    expect(store.filteredTasks().map((t) => t.id)).toEqual(['t-1']);
  });

  it('groups filtered tasks by status for the board columns', async () => {
    await setupWithInitialTasks([
      fixtureTask({ id: 't-1', status: 'todo' }),
      fixtureTask({ id: 't-2', status: 'in_progress' }),
      fixtureTask({ id: 't-3', status: 'done' }),
    ]);
    const groups = store.tasksByStatus();
    expect(groups.todo.map((t) => t.id)).toEqual(['t-1']);
    expect(groups.in_progress.map((t) => t.id)).toEqual(['t-2']);
    expect(groups.done.map((t) => t.id)).toEqual(['t-3']);
  });

  describe('create', () => {
    it('POSTs a client-stamped task and reconciles the response without a second GET', async () => {
      await setupWithInitialTasks([]);

      const promise = store.create({
        title: 'New task',
        description: 'desc',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-10-01',
        assignee,
        tags: [],
      });
      const req = httpMock.expectOne({ url: '/api/tasks', method: 'POST' });
      expect(req.request.body.createdAt).toBeTruthy();
      expect(req.request.body.updatedAt).toBeTruthy();
      expect(req.request.body.completedAt).toBeNull();
      req.flush({ ...req.request.body, id: 'task-999' });
      const created = await promise;

      expect(created.id).toBe('task-999');
      expect(store.tasks().map((t) => t.id)).toEqual(['task-999']);
      httpMock.expectNone('/api/tasks');
    });

    it('stamps completedAt when a task is created directly as done', async () => {
      await setupWithInitialTasks([]);
      const promise = store.create({
        title: 'x',
        description: 'y',
        status: 'done',
        priority: 'low',
        dueDate: '2026-10-01',
        assignee,
        tags: [],
      });
      const req = httpMock.expectOne({ url: '/api/tasks', method: 'POST' });
      expect(req.request.body.completedAt).toBeTruthy();
      req.flush({ ...req.request.body, id: 'task-999' });
      await promise;
    });
  });

  describe('update', () => {
    it('PATCHes and reconciles the response, applying the completedAt transition rule', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1', status: 'todo' })]);

      const promise = store.update('t-1', { status: 'done' });
      const req = httpMock.expectOne({ url: '/api/tasks/t-1', method: 'PATCH' });
      expect(req.request.body.completedAt).toBeTruthy();
      req.flush({
        ...fixtureTask({ id: 't-1', status: 'done' }),
        completedAt: req.request.body.completedAt,
      });
      const updated = await promise;

      expect(updated.status).toBe('done');
      expect(store.tasks().find((t) => t.id === 't-1')?.status).toBe('done');
    });

    it('normalizes a server-returned null completedAt to undefined locally', async () => {
      await setupWithInitialTasks([
        fixtureTask({ id: 't-1', status: 'done', completedAt: '2026-09-10T00:00:00.000Z' }),
      ]);

      const promise = store.update('t-1', { status: 'todo' });
      const req = httpMock.expectOne({ url: '/api/tasks/t-1', method: 'PATCH' });
      expect(req.request.body.completedAt).toBeNull();
      req.flush({ ...fixtureTask({ id: 't-1', status: 'todo' }), completedAt: null });
      await promise;

      expect(store.tasks().find((t) => t.id === 't-1')?.completedAt).toBeUndefined();
    });

    it('rejects without an HTTP call when the task id is not in the current collection', async () => {
      await setupWithInitialTasks([]);
      await expect(store.update('missing', { title: 'x' })).rejects.toThrow();
      httpMock.expectNone({ url: '/api/tasks/missing', method: 'PATCH' });
    });

    it('reconciles only the updated task, leaving every other task in the collection untouched', async () => {
      await setupWithInitialTasks([
        fixtureTask({ id: 't-1', title: 'Design homepage' }),
        fixtureTask({ id: 't-2', title: 'Ship release' }),
      ]);

      const promise = store.update('t-1', { title: 'Design new homepage' });
      httpMock
        .expectOne({ url: '/api/tasks/t-1', method: 'PATCH' })
        .flush(fixtureTask({ id: 't-1', title: 'Design new homepage' }));
      await promise;

      expect(store.tasks().map((t) => [t.id, t.title])).toEqual([
        ['t-1', 'Design new homepage'],
        ['t-2', 'Ship release'],
      ]);
    });
  });

  describe('remove', () => {
    it('DELETEs and removes the task locally', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1' }), fixtureTask({ id: 't-2' })]);
      const promise = store.remove('t-1');
      httpMock.expectOne({ url: '/api/tasks/t-1', method: 'DELETE' }).flush(null);
      await promise;
      expect(store.tasks().map((t) => t.id)).toEqual(['t-2']);
    });
  });

  describe('mutation failure', () => {
    it('preserves previous task state and exposes the real HttpErrorResponse', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
      const promise = store.update('t-1', { title: 'renamed' });
      const req = httpMock.expectOne({ url: '/api/tasks/t-1', method: 'PATCH' });
      req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

      await expect(promise).rejects.toThrow();
      expect(store.tasks().find((t) => t.id === 't-1')?.title).toBe('Design homepage');
      expect(store.mutationError()).toBeInstanceOf(HttpErrorResponse);
      expect((store.mutationError() as HttpErrorResponse).status).toBe(500);
      expect(store.mutationPending()).toBe(false);
    });

    it('normalizes a non-Error rejection (never thrown by this app today, but not part of its type contract) into a real Error', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
      vi.spyOn(TestBed.inject(HttpClient), 'patch').mockReturnValue(throwError(() => 'boom'));

      await expect(store.update('t-1', { title: 'x' })).rejects.toBe('boom');

      expect(store.mutationError()).toBeInstanceOf(Error);
      expect(store.mutationError()).not.toBeInstanceOf(HttpErrorResponse);
      expect((store.mutationError() as Error).message).toBe('boom');
      expect(store.mutationPending()).toBe(false);
    });

    it('clears mutationError at the start of the next mutation attempt', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
      const failing = store.update('t-1', { title: 'x' });
      httpMock
        .expectOne({ url: '/api/tasks/t-1', method: 'PATCH' })
        .flush(null, { status: 500, statusText: 'Server Error' });
      await expect(failing).rejects.toThrow();
      expect(store.mutationError()).toBeTruthy();

      const succeeding = store.update('t-1', { title: 'y' });
      expect(store.mutationError()).toBeUndefined();
      httpMock
        .expectOne({ url: '/api/tasks/t-1', method: 'PATCH' })
        .flush(fixtureTask({ id: 't-1', title: 'y' }));
      await succeeding;
    });
  });

  describe('concurrency', () => {
    it('rejects a second mutation while one is pending, without a second HTTP call', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
      const first = store.update('t-1', { title: 'a' });
      expect(store.mutationPending()).toBe(true);

      await expect(store.update('t-1', { title: 'b' })).rejects.toThrow();

      httpMock
        .expectOne({ url: '/api/tasks/t-1', method: 'PATCH' })
        .flush(fixtureTask({ id: 't-1', title: 'a' }));
      await first;
    });
  });

  describe('reload', () => {
    it('re-issues GET /api/tasks', async () => {
      await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
      store.reload();
      await flushMacrotask();
      httpMock
        .expectOne('/api/tasks')
        .flush([fixtureTask({ id: 't-1' }), fixtureTask({ id: 't-2' })]);
      await flushMacrotask();
      expect(store.tasks().map((t) => t.id)).toEqual(['t-1', 't-2']);
    });
  });
});

describe('TaskStore cache invalidation (with the real cache interceptor wired in)', () => {
  let httpMock: HttpTestingController;
  let store: TaskStore;
  let cache: HttpCache;

  async function setupWithInitialTasks(tasks: Task[]): Promise<void> {
    await flushMacrotask();
    httpMock.expectOne('/api/tasks').flush(tasks);
    await flushMacrotask();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(TaskStore);
    cache = TestBed.inject(HttpCache);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('invalidates the /api/tasks cache entry after a successful mutation, so a reload reaches HTTP again', async () => {
    await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
    expect(cache.get('/api/tasks')).toBeTruthy(); // the initial GET populated the cache

    const promise = store.update('t-1', { title: 'renamed' });
    httpMock
      .expectOne({ url: '/api/tasks/t-1', method: 'PATCH' })
      .flush(fixtureTask({ id: 't-1', title: 'renamed' }));
    await promise;

    expect(cache.get('/api/tasks')).toBeUndefined();

    store.reload();
    await flushMacrotask();
    httpMock.expectOne('/api/tasks').flush([fixtureTask({ id: 't-1', title: 'renamed' })]);
    await flushMacrotask();
  });

  it('leaves /api/statistics and /api/users cache entries untouched by a task mutation', async () => {
    await setupWithInitialTasks([fixtureTask({ id: 't-1' })]);
    const statisticsEntry = new HttpResponse({ body: [{ id: 'stat-001' }] });
    const usersEntry = new HttpResponse({ body: [{ id: 'user-001' }] });
    cache.set('/api/statistics', statisticsEntry);
    cache.set('/api/users', usersEntry);

    const promise = store.update('t-1', { title: 'renamed' });
    httpMock
      .expectOne({ url: '/api/tasks/t-1', method: 'PATCH' })
      .flush(fixtureTask({ id: 't-1', title: 'renamed' }));
    await promise;

    expect(cache.get('/api/statistics')).toBe(statisticsEntry);
    expect(cache.get('/api/users')).toBe(usersEntry);
  });
});
