import { ChangeDetectionStrategy, Component, HostListener, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

/**
 * Root layout: persistent topbar + sidebar around the routed page content.
 * Owns the mobile off-canvas sidebar's open/closed state — the only real
 * state in the shell — and coordinates focus when it opens/closes.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly sidebarOpen = signal(false);

  private readonly topbar = viewChild(Topbar);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.sidebarOpen()) {
      this.closeSidebar();
    }
  }

  protected toggleSidebar(): void {
    if (this.sidebarOpen()) {
      this.closeSidebar();
    } else {
      this.sidebarOpen.set(true);
    }
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
    this.topbar()?.focusToggleButton();
  }
}
