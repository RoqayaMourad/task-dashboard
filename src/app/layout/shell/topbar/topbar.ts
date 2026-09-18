import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Persistent top bar: brand, mobile nav toggle, search/notification/avatar chrome.
 * Search, notifications and the avatar have no backing feature yet (no search,
 * notifications, or auth/profile feature exists in the assignment), so they're
 * rendered as static, non-interactive visuals rather than inert controls.
 */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  readonly sidebarOpen = input(false);
  readonly toggleSidebar = output<void>();

  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggleButton');

  /** Returns focus to the toggle button after the mobile drawer closes. */
  focusToggleButton(): void {
    this.toggleButton()?.nativeElement.focus();
  }
}
