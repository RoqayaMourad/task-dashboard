import { Task } from '../../core/models/task.model';
import { dueDateLabel } from './due-date-label';

const assignee = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' };

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-09-18',
    assignee,
    tags: ['Design'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('dueDateLabel', () => {
  const now = new Date(2026, 8, 18, 23, 59); // 2026-09-18, late in the day, local time

  it('says "Due today" when due today', () => {
    expect(dueDateLabel(fixtureTask({ dueDate: '2026-09-18' }), now)).toBe('Due today');
  });

  it('says "Due tomorrow" when due tomorrow', () => {
    expect(dueDateLabel(fixtureTask({ dueDate: '2026-09-19' }), now)).toBe('Due tomorrow');
  });

  it('says "Due in N days" further out', () => {
    expect(dueDateLabel(fixtureTask({ dueDate: '2026-09-23' }), now)).toBe('Due in 5 days');
  });

  it('says "Overdue by 1 day" exactly one day late', () => {
    expect(dueDateLabel(fixtureTask({ dueDate: '2026-09-17', status: 'in_progress' }), now)).toBe(
      'Overdue by 1 day',
    );
  });

  it('says "Overdue by N days" further past due', () => {
    expect(dueDateLabel(fixtureTask({ dueDate: '2026-09-14', status: 'in_progress' }), now)).toBe(
      'Overdue by 4 days',
    );
  });

  it('does not compare by time-of-day, only local calendar day, just after local midnight', () => {
    const justAfterMidnight = new Date(2026, 8, 18, 0, 1);
    expect(dueDateLabel(fixtureTask({ dueDate: '2026-09-18' }), justAfterMidnight)).toBe(
      'Due today',
    );
  });

  it('says "Completed today" when completedAt is today', () => {
    const task = fixtureTask({ status: 'done', completedAt: '2026-09-18T10:00:00.000Z' });
    expect(dueDateLabel(task, now)).toBe('Completed today');
  });

  it('says "Completed yesterday" when completedAt was yesterday', () => {
    const task = fixtureTask({ status: 'done', completedAt: '2026-09-17T10:00:00.000Z' });
    expect(dueDateLabel(task, now)).toBe('Completed yesterday');
  });

  it('says "Completed on <date>" further back', () => {
    const task = fixtureTask({ status: 'done', completedAt: '2026-09-10T10:00:00.000Z' });
    expect(dueDateLabel(task, now)).toContain('Completed on');
  });

  it('never reports overdue for a done task, regardless of dueDate', () => {
    const task = fixtureTask({
      status: 'done',
      dueDate: '2026-09-01',
      completedAt: '2026-09-18T10:00:00.000Z',
    });
    expect(dueDateLabel(task, now)).not.toContain('Overdue');
  });
});
