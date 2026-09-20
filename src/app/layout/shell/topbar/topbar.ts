import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Persistent top bar: brand, mobile nav toggle, search, notification/avatar chrome.
 * Notifications and the avatar have no backing feature yet, so they stay static,
 * non-interactive visuals. Search is a real input, but it's dumb: it owns only
 * its own ephemeral displayed value; Shell decides when it's enabled and where
 * changes go (see `layout/shell/route-searchable.ts`).
 */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  readonly sidebarOpen = input(false);
  readonly searchEnabled = input(false);

  readonly toggleSidebar = output<void>();
  readonly searchChange = output<string>();

  protected readonly searchValue = signal('');

  private readonly toggleButton = viewChild<ElementRef<HTMLButtonElement>>('toggleButton');

  /** Returns focus to the toggle button after the mobile drawer closes. */
  focusToggleButton(): void {
    this.toggleButton()?.nativeElement.focus();
  }

  /** Clears the displayed search text; called by Shell when the searchable route deactivates. */
  resetSearch(): void {
    this.searchValue.set('');
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    this.searchChange.emit(value);
  }
}
