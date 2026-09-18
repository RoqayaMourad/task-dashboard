import { Assignee, Task } from './task.model';
import { priorityDistribution, statusDistribution } from './task-distribution';

const assignee: Assignee = {
  id: 'user-001',
  name: 'John Doe',
  avatar: 'JD',
  email: 'john@company.com',
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
    tags: [],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('priorityDistribution', () => {
  it('returns all three priority slices at zero when there are no tasks', () => {
    expect(priorityDistribution([])).toEqual([
      { key: 'high', label: 'High', count: 0, percentage: 0 },
      { key: 'medium', label: 'Medium', count: 0, percentage: 0 },
      { key: 'low', label: 'Low', count: 0, percentage: 0 },
    ]);
  });

  it('counts a single task under its own priority, others stay zero', () => {
    const result = priorityDistribution([fixtureTask({ priority: 'medium' })]);

    expect(result).toEqual([
      { key: 'high', label: 'High', count: 0, percentage: 0 },
      { key: 'medium', label: 'Medium', count: 1, percentage: 100 },
      { key: 'low', label: 'Low', count: 0, percentage: 0 },
    ]);
  });

  it('distributes counts and rounded percentages across all three priorities', () => {
    const tasks = [
      fixtureTask({ id: 't-1', priority: 'high' }),
      fixtureTask({ id: 't-2', priority: 'high' }),
      fixtureTask({ id: 't-3', priority: 'medium' }),
      fixtureTask({ id: 't-4', priority: 'low' }),
    ];

    const result = priorityDistribution(tasks);

    expect(result).toEqual([
      { key: 'high', label: 'High', count: 2, percentage: 50 },
      { key: 'medium', label: 'Medium', count: 1, percentage: 25 },
      { key: 'low', label: 'Low', count: 1, percentage: 25 },
    ]);
  });

  it('preserves high → medium → low order regardless of input order', () => {
    const tasks = [
      fixtureTask({ id: 't-1', priority: 'low' }),
      fixtureTask({ id: 't-2', priority: 'high' }),
    ];

    expect(priorityDistribution(tasks).map((slice) => slice.key)).toEqual([
      'high',
      'medium',
      'low',
    ]);
  });
});

describe('statusDistribution', () => {
  it('returns all three status slices at zero when there are no tasks', () => {
    expect(statusDistribution([])).toEqual([
      { key: 'todo', label: 'To Do', count: 0, percentage: 0 },
      { key: 'in_progress', label: 'In Progress', count: 0, percentage: 0 },
      { key: 'done', label: 'Done', count: 0, percentage: 0 },
    ]);
  });

  it('distributes counts and rounded percentages across all three statuses', () => {
    const tasks = [
      fixtureTask({ id: 't-1', status: 'todo' }),
      fixtureTask({ id: 't-2', status: 'in_progress' }),
      fixtureTask({ id: 't-3', status: 'done' }),
      fixtureTask({ id: 't-4', status: 'done' }),
    ];

    const result = statusDistribution(tasks);

    expect(result).toEqual([
      { key: 'todo', label: 'To Do', count: 1, percentage: 25 },
      { key: 'in_progress', label: 'In Progress', count: 1, percentage: 25 },
      { key: 'done', label: 'Done', count: 2, percentage: 50 },
    ]);
  });
});
