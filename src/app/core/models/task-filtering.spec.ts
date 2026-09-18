import { Task } from './task.model';
import { filterTasks, groupTasksByStatus } from './task-filtering';

const assigneeA = { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' };
const assigneeB = {
  id: 'user-002',
  name: 'Sarah Smith',
  avatar: 'SS',
  email: 'sarah.smith@company.com',
};

function task(overrides: Partial<Task>): Task {
  return {
    id: 't-1',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-09-20',
    assignee: assigneeA,
    tags: [],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

const tasks: Task[] = [
  task({
    id: 't-1',
    title: 'Design homepage',
    description: 'Create wireframes',
    status: 'todo',
    priority: 'high',
    assignee: assigneeA,
  }),
  task({
    id: 't-2',
    title: 'Fix login bug',
    description: 'Users cannot sign in',
    status: 'in_progress',
    priority: 'medium',
    assignee: assigneeB,
  }),
  task({
    id: 't-3',
    title: 'Write docs',
    description: 'Update the homepage API documentation',
    status: 'done',
    priority: 'low',
    assignee: assigneeA,
  }),
];

const noFilter = {
  search: '',
  status: 'all' as const,
  priority: 'all' as const,
  assigneeId: 'all' as const,
};

describe('filterTasks', () => {
  it('returns everything when all filters are "all" and search is empty', () => {
    expect(filterTasks(tasks, noFilter)).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterTasks(tasks, { ...noFilter, status: 'done' });
    expect(result.map((t) => t.id)).toEqual(['t-3']);
  });

  it('filters by priority', () => {
    const result = filterTasks(tasks, { ...noFilter, priority: 'medium' });
    expect(result.map((t) => t.id)).toEqual(['t-2']);
  });

  it('filters by assignee', () => {
    const result = filterTasks(tasks, { ...noFilter, assigneeId: 'user-002' });
    expect(result.map((t) => t.id)).toEqual(['t-2']);
  });

  it('searches case-insensitively across title and description', () => {
    expect(filterTasks(tasks, { ...noFilter, search: 'LOGIN' }).map((t) => t.id)).toEqual(['t-2']);
    // "homepage" appears in t-1's title and t-3's description
    expect(filterTasks(tasks, { ...noFilter, search: 'homepage' }).map((t) => t.id)).toEqual([
      't-1',
      't-3',
    ]);
  });

  it('combines multiple filters together (AND semantics)', () => {
    const result = filterTasks(tasks, { ...noFilter, status: 'todo', search: 'design' });
    expect(result.map((t) => t.id)).toEqual(['t-1']);

    const noMatch = filterTasks(tasks, { ...noFilter, status: 'done', priority: 'high' });
    expect(noMatch).toHaveLength(0);
  });
});

describe('groupTasksByStatus', () => {
  it('buckets tasks into the three status groups', () => {
    const groups = groupTasksByStatus(tasks);
    expect(groups.todo.map((t) => t.id)).toEqual(['t-1']);
    expect(groups.in_progress.map((t) => t.id)).toEqual(['t-2']);
    expect(groups.done.map((t) => t.id)).toEqual(['t-3']);
  });

  it('returns empty arrays for statuses with no tasks', () => {
    const groups = groupTasksByStatus([task({ id: 't-1', status: 'todo' })]);
    expect(groups.in_progress).toEqual([]);
    expect(groups.done).toEqual([]);
  });
});
