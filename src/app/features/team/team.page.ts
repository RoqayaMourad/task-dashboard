import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UserService } from '../../core/services/user.service';

/**
 * Smart: read-only user grid backed directly by `UserService` — the same
 * singleton `TaskBoardPage`'s assignee filter and `TaskFormDialog`'s
 * assignee select already consume, not a second source of user state.
 */
@Component({
  selector: 'app-team-page',
  templateUrl: './team.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage {
  private readonly userService = inject(UserService);

  protected readonly usersStatus = this.userService.users.status;
  /** `value()` throws while the resource is in its 'error' state (see Phase 12/13). */
  protected readonly users = computed(() =>
    this.usersStatus() === 'error' ? [] : this.userService.users.value(),
  );
  protected readonly hasUsers = computed(() => this.users().length > 0);
  /** Same reasoning as Dashboard/Analytics' skeletons: only while genuinely nothing has resolved yet. */
  protected readonly usersSkeleton = computed(
    () =>
      this.usersStatus() === 'loading' ||
      (this.usersStatus() === 'reloading' && this.users().length === 0),
  );

  protected retryUsers(): void {
    this.userService.users.reload();
  }
}
