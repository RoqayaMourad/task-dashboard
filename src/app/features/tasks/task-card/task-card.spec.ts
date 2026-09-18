import { TestBed } from '@angular/core/testing';
import { Task } from '../../../core/models/task.model';
import { TaskCard } from './task-card';

const assignee = { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 'sarah@company.com' };

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes and mockups',
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

describe('TaskCard', () => {
  function createComponent(task: Task) {
    const fixture = TestBed.createComponent(TaskCard);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();
    return fixture;
  }

  it('renders title, description, tag, priority and due-date label', () => {
    const fixture = createComponent(fixtureTask());
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Design homepage');
    expect(text).toContain('Create wireframes and mockups');
    expect(text).toContain('Design');
    expect(text).toContain('high');
    expect(text).toMatch(/Due in \d+ days|Due today|Due tomorrow/);
  });

  it('shows the assignee as "@FirstName" visually and the full name accessibly', () => {
    const fixture = createComponent(fixtureTask());

    expect(fixture.nativeElement.textContent).toContain('@Sarah');
    expect(fixture.nativeElement.textContent).not.toContain('Sarah Smith');

    const assigneeRow: HTMLElement = fixture.nativeElement.querySelector('[aria-label]');
    expect(assigneeRow.getAttribute('aria-label')).toBe('Assigned to Sarah Smith');
  });

  it('applies the overdue background and accent border for a genuinely overdue task', () => {
    const fixture = createComponent(fixtureTask({ status: 'in_progress', dueDate: '2020-01-01' }));
    const card: HTMLElement = fixture.nativeElement.querySelector('div');

    expect(card.classList.contains('bg-overdue-bg')).toBe(true);
    expect(card.classList.contains('border-overdue')).toBe(true);
  });

  it('does not apply the overdue treatment to a task that is not overdue', () => {
    const fixture = createComponent(fixtureTask({ dueDate: '2099-01-01' }));
    const card: HTMLElement = fixture.nativeElement.querySelector('div');

    expect(card.classList.contains('bg-overdue-bg')).toBe(false);
    expect(card.classList.contains('bg-white')).toBe(true);
  });

  it.each([
    ['high', 'text-priority-high'],
    ['medium', 'text-priority-medium'],
    ['low', 'text-priority-low'],
  ] as const)('applies the "%s" priority class', (priority, expectedClass) => {
    const fixture = createComponent(fixtureTask({ priority }));
    const chip: HTMLElement = fixture.nativeElement.querySelector(`.${expectedClass}`);

    expect(chip).toBeTruthy();
  });

  it('omits the tag line when the task has no tags', () => {
    const fixture = createComponent(fixtureTask({ title: 'Prepare budget report', tags: [] }));

    expect(fixture.nativeElement.textContent).not.toContain('Design');
  });
});
