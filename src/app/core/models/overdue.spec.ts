import { Task } from './task.model';
import { isTaskOverdue } from './overdue';

function fixture(
  overrides: Partial<Pick<Task, 'status' | 'dueDate'>>,
): Pick<Task, 'status' | 'dueDate'> {
  return { status: 'todo', dueDate: '2026-09-18', ...overrides };
}

describe('isTaskOverdue', () => {
  const now = new Date(2026, 8, 18, 23, 59); // 2026-09-18, late in the day

  it('is not overdue when due today', () => {
    expect(isTaskOverdue(fixture({ dueDate: '2026-09-18' }), now)).toBe(false);
  });

  it('is overdue when due yesterday and not done', () => {
    expect(isTaskOverdue(fixture({ dueDate: '2026-09-17', status: 'in_progress' }), now)).toBe(
      true,
    );
  });

  it('is not overdue when due yesterday but already done', () => {
    expect(isTaskOverdue(fixture({ dueDate: '2026-09-17', status: 'done' }), now)).toBe(false);
  });

  it('is not overdue when due tomorrow', () => {
    expect(isTaskOverdue(fixture({ dueDate: '2026-09-19' }), now)).toBe(false);
  });

  it('compares by calendar day, not time-of-day, even just after local midnight', () => {
    const justAfterMidnight = new Date(2026, 8, 18, 0, 1);
    expect(isTaskOverdue(fixture({ dueDate: '2026-09-18' }), justAfterMidnight)).toBe(false);
  });

  it('never trusts a raw isOverdue-like flag — only status and dueDate are consulted', () => {
    const task = { ...fixture({ dueDate: '2026-09-19' }), isOverdue: true } as Pick<
      Task,
      'status' | 'dueDate'
    > & {
      isOverdue: boolean;
    };
    expect(isTaskOverdue(task, now)).toBe(false);
  });
});
