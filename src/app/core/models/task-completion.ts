import { TaskStatus } from './task.model';

/**
 * The `completedAt` transition rule, considering both the task's previous
 * state and the incoming status change, never the patch in isolation:
 *
 * - non-done -> done: stamp `now`
 * - done -> done: preserve the existing `completedAt`
 * - done -> non-done: clear it
 * - non-done -> non-done: no `completedAt`
 *
 * Returns `null` (not `undefined`) when there should be no `completedAt`,
 * so callers send an explicit `null` over the wire: omitting the key from
 * a PATCH body would leave a stale value in place rather than clearing it.
 */
export function resolveCompletedAt(
  previousStatus: TaskStatus | undefined,
  nextStatus: TaskStatus,
  previousCompletedAt: string | undefined,
  now: string,
): string | null {
  const wasDone = previousStatus === 'done';
  const isDone = nextStatus === 'done';

  if (!wasDone && isDone) {
    return now;
  }
  if (wasDone && isDone) {
    return previousCompletedAt ?? null;
  }
  return null;
}
