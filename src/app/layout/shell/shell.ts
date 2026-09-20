import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isRouteSearchable, RouteSearchable } from './route-searchable';
import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

/**
 * Root layout: persistent topbar + sidebar around the routed page content.
 * Owns the mobile off-canvas sidebar's open/closed state and, via the
 * router outlet's activate/deactivate events, a reference to whichever
 * routed page currently implements `RouteSearchable`, never the search
 * term itself, and never a feature store.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  protected readonly sidebarOpen = signal(false);

  private readonly activeSearchable = signal<RouteSearchable | null>(null);
  protected readonly searchEnabled = computed(() => this.activeSearchable() !== null);

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

  protected onRouteActivate(component: unknown): void {
    this.activeSearchable.set(isRouteSearchable(component) ? component : null);
  }

  protected onRouteDeactivate(): void {
    this.activeSearchable.set(null);
    this.topbar()?.resetSearch();
  }

  protected onSearch(term: string): void {
    this.activeSearchable()?.setSearchTerm(term);
  }
}
