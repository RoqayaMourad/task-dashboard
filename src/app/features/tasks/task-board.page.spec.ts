import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Assignee, Task, TaskStatus } from '../../core/models/task.model';
import { TaskStore } from '../../core/services/task.store';
import { TaskBoardPage } from './task-board.page';

@Component({ selector: 'app-stub-page', template: '' })
class StubPage {}

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
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: StubPage }]),
      ],
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

  it('reflects a persisted assignee filter in the select after the page is recreated (navigate away and back)', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks([
      fixtureTask({ id: 't-1', assignee }),
      fixtureTask({ id: 't-2', assignee: assignee2 }),
    ]);
    await flushUsers();
    fixture.detectChanges();

    const taskStore = TestBed.inject(TaskStore);
    taskStore.assigneeFilter.set(assignee2.id);
    fixture.detectChanges();

    // Simulates leaving /tasks and coming back: the routed page is destroyed
    // and a fresh instance created, while TaskStore/UserService (root
    // singletons) keep their already-resolved state, exactly as Shell's
    // router-outlet activate/deactivate cycle does in the real app.
    fixture.destroy();
    const fixture2 = TestBed.createComponent(TaskBoardPage);
    fixture2.detectChanges();

    const select: HTMLSelectElement = fixture2.nativeElement.querySelector('#assignee-filter');
    expect(select.value).toBe(assignee2.id);
    expect(fixture2.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
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

  // --- Increment 3: Create / Edit / Delete -----------------------------

  async function boardReady(tasks: Task[] = [fixtureTask()]): Promise<void> {
    fixture.detectChanges();
    await flushMacrotask();
    await flushTasks(tasks);
    await flushUsers();
    fixture.detectChanges();
  }

  function buttonByText(text: string): HTMLButtonElement {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    return buttons.find((b) => b.textContent?.trim() === text)!;
  }

  function setValue(selector: string, value: string): void {
    const el = fixture.nativeElement.querySelector(selector) as
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    el.value = value;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  function kebabButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-haspopup="menu"]');
  }

  function clickMenuItem(text: string): void {
    kebabButton().click();
    fixture.detectChanges();
    const items: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
    );
    const item = items.find((el) => el.textContent?.trim() === text)!;
    item.querySelector<HTMLElement>('.p-menu-item-content')!.click();
    fixture.detectChanges();
  }

  function fillValidTaskForm(): void {
    setValue('#task-title', 'Ship the feature');
    setValue('#task-description', 'Write the code');
    setValue('#task-due-date', '2026-10-01');
    setValue('#task-assignee', assignee.id);
  }

  function submitForm(): void {
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  it('opens the create dialog on New Task and creates via TaskStore, leaving completedAt to it', async () => {
    await boardReady([]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('New Task');

    fillValidTaskForm();
    setValue('#task-status', 'done');
    submitForm();

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Ship the feature');
    // The form has no notion of completedAt at all (CreateTaskInput has no
    // such field); TaskStore.create() is what stamped this, via
    // resolveCompletedAt(undefined, 'done', undefined, now).
    expect(typeof req.request.body.completedAt).toBe('string');

    req.flush({
      ...req.request.body,
      id: 'new-1',
      assignee,
    });
    await flushMacrotask();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#task-title')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
  });

  it('places a newly created task by its dueDate, above an existing later-due task', async () => {
    await boardReady([
      fixtureTask({ id: 'later', title: 'Later task', status: 'todo', dueDate: '2026-12-01' }),
    ]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm(); // due 2026-10-01, earlier than the existing 'later' task
    submitForm();

    const req = httpMock.expectOne('/api/tasks');
    req.flush({ ...req.request.body, id: 'new-1', assignee });
    await flushMacrotask();
    fixture.detectChanges();

    const todoCards = Array.from(
      columnSection('To Do').querySelectorAll('app-task-card h3'),
    ) as HTMLElement[];
    expect(todoCards.map((h) => h.textContent?.trim())).toEqual(['Ship the feature', 'Later task']);
  });

  it('places a newly created task by its dueDate, below an existing earlier-due task, never forced to the top', async () => {
    await boardReady([
      fixtureTask({ id: 'earlier', title: 'Earlier task', status: 'todo', dueDate: '2026-01-01' }),
    ]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm(); // due 2026-10-01, later than the existing 'earlier' task
    submitForm();

    const req = httpMock.expectOne('/api/tasks');
    req.flush({ ...req.request.body, id: 'new-1', assignee });
    await flushMacrotask();
    fixture.detectChanges();

    const todoCards = Array.from(
      columnSection('To Do').querySelectorAll('app-task-card h3'),
    ) as HTMLElement[];
    expect(todoCards.map((h) => h.textContent?.trim())).toEqual([
      'Earlier task',
      'Ship the feature',
    ]);
  });

  it('keeps the create dialog open with an inline error, preserving values, on failure', async () => {
    await boardReady([]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm();
    submitForm();

    const req = httpMock.expectOne('/api/tasks');
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('New Task');
    expect(fixture.nativeElement.textContent).toContain('Something went wrong (500)');
    expect((fixture.nativeElement.querySelector('#task-title') as HTMLInputElement).value).toBe(
      'Ship the feature',
    );
  });

  it('opens the edit dialog pre-filled from the kebab menu and updates via TaskStore', async () => {
    await boardReady([fixtureTask({ id: 't-1', title: 'Design homepage' })]);

    clickMenuItem('Edit');

    expect(fixture.nativeElement.textContent).toContain('Edit Task');
    expect((fixture.nativeElement.querySelector('#task-title') as HTMLInputElement).value).toBe(
      'Design homepage',
    );

    setValue('#task-title', 'Design new homepage');
    submitForm();

    const req = httpMock.expectOne('/api/tasks/t-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.title).toBe('Design new homepage');

    req.flush({ ...fixtureTask({ id: 't-1', title: 'Design new homepage' }) });
    await flushMacrotask();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Edit Task');
    expect(fixture.nativeElement.textContent).toContain('Design new homepage');
  });

  it('disables New Task and every kebab trigger while a mutation is pending', async () => {
    await boardReady([fixtureTask({ id: 't-1' })]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm();
    submitForm();

    expect(buttonByText('+ New Task').disabled).toBe(true);
    expect(kebabButton().disabled).toBe(true);

    httpMock.expectOne('/api/tasks').flush({ ...fixtureTask({ id: 'new-1' }) });
    await flushMacrotask();
    fixture.detectChanges();
  });

  it('ignores Edit/Delete triggers while a mutation is already pending (defense-in-depth behind the disabled UI)', async () => {
    await boardReady([fixtureTask({ id: 't-1' })]);
    const trigger = kebabButton();

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm();
    submitForm();
    expect(TestBed.inject(TaskStore).mutationPending()).toBe(true);

    // Bypasses the disabled kebab/menu UI to exercise the component's own
    // state guard directly, in case either handler is ever reachable by a
    // route other than the (already-disabled) menu, e.g. a future
    // keyboard shortcut.
    const board = fixture.componentInstance as unknown as {
      openEditForm(event: { task: Task; trigger: HTMLElement }): void;
      confirmDelete(event: { task: Task; trigger: HTMLElement }): void;
    };
    board.openEditForm({ task: fixtureTask({ id: 't-1' }), trigger });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Edit Task');

    board.confirmDelete({ task: fixtureTask({ id: 't-1' }), trigger });
    fixture.detectChanges();
    expect(document.querySelector('.p-confirmdialog')).toBeNull();

    httpMock.expectOne('/api/tasks').flush({ ...fixtureTask({ id: 'new-1' }) });
    await flushMacrotask();
    fixture.detectChanges();
  });

  it('shows a delete confirmation naming the task, deletes on accept, and restores focus to New Task', async () => {
    await boardReady([fixtureTask({ id: 't-1', title: 'Design homepage' })]);
    const trigger = kebabButton();

    clickMenuItem('Delete');

    // ConfirmDialog's default appendTo is 'body' (unlike Dialog/Menu's 'self'), so its content
    // is appended to document.body, not inside fixture.nativeElement.
    const confirmRoot: HTMLElement = document.querySelector('.p-confirmdialog')!;
    expect(confirmRoot.textContent).toContain('Design homepage');

    const acceptButton: HTMLButtonElement = confirmRoot.querySelector(
      '.p-confirmdialog-accept-button',
    )!;
    acceptButton.click();
    fixture.detectChanges();
    // Lets ConfirmDialog's own close teardown (it removes the accept button
    // we just clicked from the DOM) fully settle before the deletion
    // resolves, so its cleanup can't race our own focus restoration below.
    await flushMacrotask();
    fixture.detectChanges();

    const req = httpMock.expectOne('/api/tasks/t-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    await flushMacrotask();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(0);
    // The deleted card's kebab button no longer exists, so focus falls back to New Task.
    expect(trigger.isConnected).toBe(false);
    expect(document.activeElement).toBe(buttonByText('+ New Task'));
  });

  it('shows a board-level banner and restores focus to the kebab on a failed delete', async () => {
    await boardReady([fixtureTask({ id: 't-1', title: 'Design homepage' })]);
    const trigger = kebabButton();

    clickMenuItem('Delete');
    const acceptButton: HTMLButtonElement = document.querySelector(
      '.p-confirmdialog-accept-button',
    )!;
    acceptButton.click();
    fixture.detectChanges();
    await flushMacrotask();
    fixture.detectChanges();

    httpMock.expectOne('/api/tasks/t-1').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner?.textContent).toContain('Something went wrong (500)');
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
    expect(document.activeElement).toBe(trigger);
  });

  it('cancelling the confirmation restores focus to the kebab without deleting', async () => {
    await boardReady([fixtureTask({ id: 't-1' })]);
    const trigger = kebabButton();

    clickMenuItem('Delete');
    const confirmRoot: HTMLElement = document.querySelector('.p-confirmdialog')!;
    const rejectButton: HTMLButtonElement = confirmRoot.querySelector(
      '.p-confirmdialog-reject-button',
    )!;
    rejectButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(1);
    expect(document.activeElement).toBe(trigger);
  });

  it('restores focus to the kebab that opened Edit after Cancel', async () => {
    await boardReady([fixtureTask({ id: 't-1' })]);
    const trigger = kebabButton();

    clickMenuItem('Edit');
    buttonByText('Cancel').click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger);
  });

  it('restores focus to the New Task button after cancelling create', async () => {
    await boardReady([]);
    const button = buttonByText('+ New Task');

    button.click();
    fixture.detectChanges();
    buttonByText('Cancel').click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(button);
  });

  // --- Increment 4: Drag-and-drop status changes ------------------------
  //
  // jsdom has no real pointer/drag-gesture pipeline (the same limitation
  // already documented for Chart.js's canvas), so these call the
  // component's own drop handler directly with a minimal event shape
  // carrying only what it reads (`previousContainer.data`/`container.data`/
  // `item.data`) rather than simulating a real CDK pointer drag.

  interface FakeDrop {
    previousContainer: { data: TaskStatus };
    container: { data: TaskStatus };
    item: { data: Task };
  }

  function dropEvent(source: TaskStatus, target: TaskStatus, task: Task): FakeDrop {
    return {
      previousContainer: { data: source },
      container: { data: target },
      item: { data: task },
    };
  }

  function dispatchDrop(event: FakeDrop): void {
    (fixture.componentInstance as unknown as { onCardDropped(e: FakeDrop): void }).onCardDropped(
      event,
    );
    fixture.detectChanges();
  }

  function columnSection(label: string): HTMLElement {
    const headings: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('h2'));
    return headings.find((h) => h.textContent?.trim() === label)!.closest('section')!;
  }

  it('delegates a cross-column drop to TaskStore.update with the typed target status', async () => {
    await boardReady([fixtureTask({ id: 't-1', status: 'todo' })]);

    dispatchDrop(dropEvent('todo', 'in_progress', fixtureTask({ id: 't-1', status: 'todo' })));

    const req = httpMock.expectOne('/api/tasks/t-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.status).toBe('in_progress');

    req.flush(fixtureTask({ id: 't-1', status: 'in_progress' }));
    await flushMacrotask();
    fixture.detectChanges();

    expect(columnSection('In Progress').textContent).toContain('Design homepage');
    expect(columnSection('To Do').textContent).not.toContain('Design homepage');
  });

  it('is a no-op when the drop target status equals the source status', async () => {
    await boardReady([fixtureTask({ id: 't-1', status: 'todo' })]);

    dispatchDrop(dropEvent('todo', 'todo', fixtureTask({ id: 't-1', status: 'todo' })));

    httpMock.expectNone('/api/tasks/t-1');
  });

  it('ignores a drop while a mutation is already pending', async () => {
    await boardReady([fixtureTask({ id: 't-1', status: 'todo' })]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm();
    submitForm();
    expect(TestBed.inject(TaskStore).mutationPending()).toBe(true);

    dispatchDrop(dropEvent('todo', 'done', fixtureTask({ id: 't-1', status: 'todo' })));
    httpMock.expectNone('/api/tasks/t-1');

    httpMock.expectOne('/api/tasks').flush({ ...fixtureTask({ id: 'new-1' }) });
    await flushMacrotask();
    fixture.detectChanges();
  });

  it('disables dragging on every card while a mutation is pending', async () => {
    await boardReady([fixtureTask({ id: 't-1' })]);

    const dragBefore = fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag);
    expect(dragBefore.disabled).toBe(false);

    buttonByText('+ New Task').click();
    fixture.detectChanges();
    fillValidTaskForm();
    submitForm();
    fixture.detectChanges();

    const dragAfter = fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag);
    expect(dragAfter.disabled).toBe(true);

    httpMock.expectOne('/api/tasks').flush({ ...fixtureTask({ id: 'new-1' }) });
    await flushMacrotask();
    fixture.detectChanges();
  });

  it('shows the board-level banner and leaves the task in its original column on a failed drop', async () => {
    await boardReady([fixtureTask({ id: 't-1', title: 'Design homepage', status: 'todo' })]);

    dispatchDrop(
      dropEvent(
        'todo',
        'done',
        fixtureTask({ id: 't-1', title: 'Design homepage', status: 'todo' }),
      ),
    );

    httpMock.expectOne('/api/tasks/t-1').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner?.textContent).toContain('Something went wrong (500)');
    expect(columnSection('To Do').textContent).toContain('Design homepage');
    expect(columnSection('Done').textContent).not.toContain('Design homepage');
  });

  it('still delegates a cross-column drop while a non-status filter is active', async () => {
    await boardReady([
      fixtureTask({ id: 't-1', status: 'todo', priority: 'high' }),
      fixtureTask({ id: 't-2', status: 'todo', priority: 'low' }),
    ]);

    TestBed.inject(TaskStore).priorityFilter.set('high');
    fixture.detectChanges();

    dispatchDrop(
      dropEvent(
        'todo',
        'in_progress',
        fixtureTask({ id: 't-1', status: 'todo', priority: 'high' }),
      ),
    );

    const req = httpMock.expectOne('/api/tasks/t-1');
    expect(req.request.body.status).toBe('in_progress');

    req.flush(fixtureTask({ id: 't-1', status: 'in_progress', priority: 'high' }));
    await flushMacrotask();
    fixture.detectChanges();
  });

  // --- Phase 20.6: "/tasks?new" one-shot navigation intent ---------------
  //
  // The static "+ New Task" button's own label always contains the
  // substring "New Task", so these checks use `#task-title` (only rendered
  // while the form dialog is actually open) and the PrimeNG dialog's own
  // `.p-dialog-title` heading, never a page-wide text-content substring
  // match against "New Task".

  function dialogHeading(): string | null {
    return fixture.nativeElement.querySelector('.p-dialog-title')?.textContent?.trim() ?? null;
  }

  it('does not open the Create dialog on a plain /tasks mount with no intent', async () => {
    await boardReady([]);

    expect(fixture.nativeElement.querySelector('#task-title')).toBeNull();
  });

  it('opens the Create dialog on arrival via /tasks?new and clears the param back to bare /tasks', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/tasks?new');

    // Fresh instance mirroring a real route activation after that
    // navigation; the shared `fixture` from beforeEach predates it.
    fixture = TestBed.createComponent(TaskBoardPage);
    await boardReady([]);

    expect(dialogHeading()).toBe('New Task');
    expect(TestBed.inject(Location).path()).toBe('/tasks');
  });

  it('reopens the Create dialog on a second /tasks?new navigation while the page stays mounted', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/tasks?new');
    fixture = TestBed.createComponent(TaskBoardPage);
    await boardReady([]);
    expect(dialogHeading()).toBe('New Task');

    // First intent already consumed; dismiss it, same as a normal Cancel.
    buttonByText('Cancel').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#task-title')).toBeNull();

    await router.navigateByUrl('/tasks?new');
    fixture.detectChanges();
    await flushMacrotask();
    fixture.detectChanges();

    expect(dialogHeading()).toBe('New Task');
    expect(TestBed.inject(Location).path()).toBe('/tasks');
  });

  it('does not clobber an already-open Edit dialog with an incoming /tasks?new intent', async () => {
    await boardReady([fixtureTask({ id: 't-1', title: 'Design homepage' })]);

    clickMenuItem('Edit');
    expect(dialogHeading()).toBe('Edit Task');

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/tasks?new');
    fixture.detectChanges();

    expect(dialogHeading()).toBe('Edit Task');
  });

  it('leaves the in-page New Task button working unchanged alongside the query intent', async () => {
    await boardReady([]);

    buttonByText('+ New Task').click();
    fixture.detectChanges();

    expect(dialogHeading()).toBe('New Task');
  });
});
