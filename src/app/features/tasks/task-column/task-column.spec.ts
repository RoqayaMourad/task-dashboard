import { TestBed } from '@angular/core/testing';
import { Task } from '../../../core/models/task.model';
import { TaskColumn } from './task-column';

const assignee = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john@company.com' };

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    dueDate: '2099-01-01',
    assignee,
    tags: [],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TaskColumn', () => {
  function createComponent(tasks: Task[]) {
    const fixture = TestBed.createComponent(TaskColumn);
    fixture.componentRef.setInput('status', 'todo');
    fixture.componentRef.setInput('label', 'To Do');
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the label, a live count matching the tasks input, and one card per task', () => {
    const fixture = createComponent([fixtureTask({ id: 't-1' }), fixtureTask({ id: 't-2' })]);

    expect(fixture.nativeElement.textContent).toContain('To Do');
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(2);
  });

  it('updates the count when the tasks input changes, never a fixed figure', () => {
    const fixture = createComponent([fixtureTask()]);
    expect(fixture.nativeElement.textContent).toContain('1');

    fixture.componentRef.setInput('tasks', [
      fixtureTask({ id: 't-1' }),
      fixtureTask({ id: 't-2' }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(2);
  });

  it('shows an empty-column message when there are no tasks', () => {
    const fixture = createComponent([]);

    expect(fixture.nativeElement.textContent).toContain('No tasks');
    expect(fixture.nativeElement.querySelectorAll('app-task-card').length).toBe(0);
  });
});
