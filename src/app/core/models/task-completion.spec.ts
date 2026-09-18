import { resolveCompletedAt } from './task-completion';

describe('resolveCompletedAt', () => {
  const now = '2026-09-18T12:00:00.000Z';

  it('stamps now when transitioning from a non-done status into done', () => {
    expect(resolveCompletedAt('todo', 'done', undefined, now)).toBe(now);
    expect(resolveCompletedAt('in_progress', 'done', undefined, now)).toBe(now);
  });

  it('treats task creation (no previous status) as non-done for the transition rule', () => {
    expect(resolveCompletedAt(undefined, 'done', undefined, now)).toBe(now);
  });

  it('preserves the existing completedAt when already done and staying done', () => {
    expect(resolveCompletedAt('done', 'done', '2026-09-10T00:00:00.000Z', now)).toBe(
      '2026-09-10T00:00:00.000Z',
    );
  });

  it('falls back to null if a done task somehow had no completedAt and stays done', () => {
    expect(resolveCompletedAt('done', 'done', undefined, now)).toBeNull();
  });

  it('clears completedAt when moving from done back to an active status', () => {
    expect(resolveCompletedAt('done', 'todo', '2026-09-10T00:00:00.000Z', now)).toBeNull();
    expect(resolveCompletedAt('done', 'in_progress', '2026-09-10T00:00:00.000Z', now)).toBeNull();
  });

  it('has no completedAt when moving between two non-done statuses', () => {
    expect(resolveCompletedAt('todo', 'in_progress', undefined, now)).toBeNull();
    expect(resolveCompletedAt('in_progress', 'todo', undefined, now)).toBeNull();
  });
});
