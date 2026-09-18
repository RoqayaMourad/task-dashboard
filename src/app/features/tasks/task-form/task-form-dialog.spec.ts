import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Assignee, CreateTaskInput, Task } from '../../../core/models/task.model';
import { TaskFormDialog } from './task-form-dialog';

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
    dueDate: '2026-09-25',
    assignee,
    tags: ['Design'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TaskFormDialog', () => {
  let fixture: ComponentFixture<TaskFormDialog>;

  function open(overrides: {
    mode?: 'create' | 'edit';
    task?: Task | null;
    assigneeOptions?: Assignee[];
    assigneeOptionsStatus?: 'loading' | 'resolved' | 'error';
    pending?: boolean;
    error?: HttpErrorResponse | Error;
  }): void {
    fixture.componentRef.setInput('mode', overrides.mode ?? 'create');
    fixture.componentRef.setInput('task', overrides.task ?? null);
    fixture.componentRef.setInput(
      'assigneeOptions',
      overrides.assigneeOptions ?? [assignee, assignee2],
    );
    fixture.componentRef.setInput(
      'assigneeOptionsStatus',
      overrides.assigneeOptionsStatus ?? 'resolved',
    );
    fixture.componentRef.setInput('pending', overrides.pending ?? false);
    fixture.componentRef.setInput('error', overrides.error);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  }

  function field<T extends HTMLElement>(selector: string): T {
    return fixture.nativeElement.querySelector(selector) as T;
  }

  function setValue(selector: string, value: string): void {
    const el = field<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector);
    el.value = value;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'));
    fixture.detectChanges();
  }

  function submitButton(): HTMLButtonElement {
    return field<HTMLButtonElement>('button[type="submit"]');
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskFormDialog);
    fixture.componentRef.setInput('visible', false);
    fixture.componentRef.setInput('mode', 'create');
    fixture.componentRef.setInput('assigneeOptions', []);
    fixture.componentRef.setInput('assigneeOptionsStatus', 'resolved');
    fixture.detectChanges();
  });

  it('starts a create-mode form with blank/default values', () => {
    open({ mode: 'create' });

    expect(field<HTMLInputElement>('#task-title').value).toBe('');
    expect(field<HTMLSelectElement>('#task-priority').value).toBe('medium');
    expect(field<HTMLSelectElement>('#task-status').value).toBe('todo');
    expect(field<HTMLInputElement>('#task-due-date').value).toBe('');
    expect(submitButton().disabled).toBe(true); // required fields still empty
  });

  it('pre-fills an edit-mode form from the given task, including tags', () => {
    const task = fixtureTask({ tags: ['Backend', 'Critical'] });
    open({ mode: 'edit', task });

    expect(field<HTMLInputElement>('#task-title').value).toBe('Design homepage');
    expect(field<HTMLSelectElement>('#task-priority').value).toBe('high');
    expect(field<HTMLInputElement>('#task-due-date').value).toBe('2026-09-25');
    expect(field<HTMLSelectElement>('#task-assignee').value).toBe('user-001');
    const tagText = fixture.nativeElement.textContent as string;
    expect(tagText).toContain('Backend');
    expect(tagText).toContain('Critical');
  });

  it('blocks submit on a whitespace-only title', () => {
    open({ mode: 'create' });
    setValue('#task-title', '   ');
    setValue('#task-description', 'Some description');
    setValue('#task-due-date', '2026-10-01');
    setValue('#task-assignee', 'user-001');

    expect(submitButton().disabled).toBe(true);
  });

  it('adds and removes tags via the FormArray, keeping them out of blank/duplicate state', () => {
    open({ mode: 'create' });
    const newTagInput = field<HTMLInputElement>('#task-new-tag');
    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b): b is HTMLButtonElement => (b as HTMLButtonElement).textContent?.trim() === 'Add',
    )!;

    newTagInput.value = 'Backend';
    newTagInput.dispatchEvent(new Event('input'));
    addButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent as string).toContain('Backend');

    const removeButton = field<HTMLButtonElement>('[aria-label="Remove tag Backend"]');
    removeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent as string).not.toContain('Backend');
  });

  it('rejects a duplicate tag at the FormArray level', () => {
    open({ mode: 'edit', task: fixtureTask({ tags: ['Backend'] }) });
    const newTagInput = field<HTMLInputElement>('#task-new-tag');
    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b): b is HTMLButtonElement => (b as HTMLButtonElement).textContent?.trim() === 'Add',
    )!;

    newTagInput.value = 'backend';
    newTagInput.dispatchEvent(new Event('input'));
    addButton.click();
    fixture.detectChanges();

    setValue('#task-title', 'Valid title');
    setValue('#task-description', 'Valid description');
    setValue('#task-due-date', '2026-10-01');
    setValue('#task-assignee', 'user-001');

    expect(submitButton().disabled).toBe(true);
  });

  it('shows an accessible duplicate-tag message as soon as the duplicate is added, without requiring submit', () => {
    open({ mode: 'edit', task: fixtureTask({ tags: ['Backend'] }) });
    const newTagInput = field<HTMLInputElement>('#task-new-tag');
    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b): b is HTMLButtonElement => (b as HTMLButtonElement).textContent?.trim() === 'Add',
    )!;

    newTagInput.value = 'backend';
    newTagInput.dispatchEvent(new Event('input'));
    addButton.click();
    fixture.detectChanges();

    // Save is disabled at this point, so it never fires — the message must
    // not depend on onSubmit()'s markAllAsTouched() ever running.
    expect(submitButton().disabled).toBe(true);

    const message = fixture.nativeElement.querySelector('#task-tags-error');
    expect(message?.textContent).toContain('unique');
    expect(message?.getAttribute('role')).toBe('alert');
    expect(newTagInput.getAttribute('aria-describedby')).toBe('task-tags-error');
    expect(newTagInput.getAttribute('aria-invalid')).toBe('true');
  });

  it('clears the duplicate-tag message once the duplicate is removed', () => {
    open({ mode: 'edit', task: fixtureTask({ tags: ['Backend'] }) });
    const newTagInput = field<HTMLInputElement>('#task-new-tag');
    const addButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b): b is HTMLButtonElement => (b as HTMLButtonElement).textContent?.trim() === 'Add',
    )!;
    newTagInput.value = 'backend';
    newTagInput.dispatchEvent(new Event('input'));
    addButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#task-tags-error')).not.toBeNull();

    const removeButton = field<HTMLButtonElement>('[aria-label="Remove tag backend"]');
    removeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#task-tags-error')).toBeNull();
  });

  it('does not flag a prefilled assignee as missing while options are still loading, even once touched', () => {
    open({
      mode: 'edit',
      task: fixtureTask(),
      assigneeOptionsStatus: 'loading',
      assigneeOptions: [],
    });

    field<HTMLSelectElement>('#task-assignee').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#task-assignee-error')).toBeNull();
  });

  it('blocks submission and shows an error when the persisted assignee no longer exists once options resolve', () => {
    open({
      mode: 'edit',
      task: fixtureTask(),
      assigneeOptionsStatus: 'resolved',
      assigneeOptions: [assignee2],
    });

    expect(fixture.nativeElement.querySelector('#task-assignee-error')?.textContent).toContain(
      'no longer available',
    );
    expect(submitButton().disabled).toBe(true);
  });

  it('emits save with a correctly mapped CreateTaskInput on a valid submit', () => {
    open({ mode: 'create' });
    const emitted = vi.fn();
    fixture.componentInstance.save.subscribe(emitted);

    setValue('#task-title', '  Ship the feature  ');
    setValue('#task-description', '  Write the code  ');
    setValue('#task-priority', 'low');
    setValue('#task-status', 'in_progress');
    setValue('#task-due-date', '2026-10-01');
    setValue('#task-assignee', 'user-002');

    expect(submitButton().disabled).toBe(false);
    submitButton().click();

    const expected: CreateTaskInput = {
      title: 'Ship the feature',
      description: 'Write the code',
      status: 'in_progress',
      priority: 'low',
      dueDate: '2026-10-01',
      assignee: assignee2,
      tags: [],
    };
    expect(emitted).toHaveBeenCalledWith(expected);
  });

  it('disables submit and cancel, and blocks dismissal, while a mutation is pending', () => {
    open({ mode: 'create', pending: true });
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);

    const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b): b is HTMLButtonElement => (b as HTMLButtonElement).textContent?.trim() === 'Cancel',
    )!;
    expect(cancelButton.disabled).toBe(true);
    expect(submitButton().disabled).toBe(true);

    cancelButton.click();
    expect(dismissed).not.toHaveBeenCalled();
  });

  it('emits dismissed when Cancel is clicked while idle', () => {
    open({ mode: 'create' });
    const dismissed = vi.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);

    const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b): b is HTMLButtonElement => (b as HTMLButtonElement).textContent?.trim() === 'Cancel',
    )!;
    cancelButton.click();

    expect(dismissed).toHaveBeenCalledTimes(1);
  });

  it('shows the mutation error message inline when error is set', () => {
    open({ mode: 'create', error: new HttpErrorResponse({ status: 500 }) });

    expect(fixture.nativeElement.textContent).toContain('Something went wrong (500)');
  });
});
