import { Task } from '../../core/models/task.model';
import { deriveRecentActivity } from './activity';

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

describe('deriveRecentActivity', () => {
  it('classifies a task as "created" when updatedAt equals createdAt', () => {
    const [item] = deriveRecentActivity([
      fixtureTask({ createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }),
    ]);

    expect(item.kind).toBe('created');
    expect(item.at).toBe('2026-09-01T00:00:00.000Z');
  });

  it('classifies a task as "updated" only when updatedAt is strictly later than createdAt', () => {
    const [item] = deriveRecentActivity([
      fixtureTask({ createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-03T00:00:00.000Z' }),
    ]);

    expect(item.kind).toBe('updated');
    expect(item.at).toBe('2026-09-03T00:00:00.000Z');
  });

  it('never claims which field changed or who performed the action', () => {
    const [item] = deriveRecentActivity([
      fixtureTask({ createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-03T00:00:00.000Z' }),
    ]);

    expect(Object.keys(item)).toEqual(['taskId', 'taskTitle', 'kind', 'at']);
  });

  it('excludes a task whose createdAt cannot be parsed and has no later valid updatedAt', () => {
    const items = deriveRecentActivity([
      fixtureTask({ createdAt: 'not-a-date', updatedAt: 'not-a-date' }),
    ]);

    expect(items).toEqual([]);
  });

  it('excludes a task with an unparseable createdAt even when updatedAt is valid', () => {
    const items = deriveRecentActivity([
      fixtureTask({ createdAt: 'not-a-date', updatedAt: '2026-09-03T00:00:00.000Z' }),
    ]);

    expect(items).toEqual([]);
  });

  it('sorts newest activity first', () => {
    const items = deriveRecentActivity([
      fixtureTask({
        id: 't-old',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      }),
      fixtureTask({
        id: 't-new',
        createdAt: '2026-09-05T00:00:00.000Z',
        updatedAt: '2026-09-05T00:00:00.000Z',
      }),
    ]);

    expect(items.map((i) => i.taskId)).toEqual(['t-new', 't-old']);
  });

  it('breaks ties on identical timestamps deterministically by task id', () => {
    const items = deriveRecentActivity([
      fixtureTask({
        id: 't-b',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      }),
      fixtureTask({
        id: 't-a',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      }),
    ]);

    expect(items.map((i) => i.taskId)).toEqual(['t-a', 't-b']);
  });

  it('limits results to the requested count', () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      fixtureTask({
        id: `task-${i}`,
        createdAt: `2026-09-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
        updatedAt: `2026-09-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
      }),
    );

    expect(deriveRecentActivity(tasks, 5)).toHaveLength(5);
  });
});
