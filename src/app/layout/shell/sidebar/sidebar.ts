import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: 'dashboard' | 'tasks' | 'calendar' | 'analytics' | 'team' | 'settings';
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Tasks', path: '/tasks', icon: 'tasks' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar' },
  { label: 'Analytics', path: '/analytics', icon: 'analytics' },
  { label: 'Team', path: '/team', icon: 'team' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

/**
 * Primary navigation. Below the `lg` breakpoint it doubles as an off-canvas
 * drawer: `open` toggles plain `hidden`/`flex` classes (native `display: none`
 * already removes hidden content from the tab order and a11y tree — no `inert`
 * or JS breakpoint tracking needed), while `lg:flex` unconditionally keeps it
 * visible on desktop regardless of `open`.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly open = input(false);
  readonly navigated = output<void>();

  protected readonly navItems = NAV_ITEMS;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Move focus into the drawer when it opens (mobile only — the panel is
    // only reachable via the topbar's toggle button, which is itself hidden
    // on desktop, so this never fires outside a mobile "open" interaction).
    effect(() => {
      if (this.open()) {
        this.panel()?.nativeElement.focus();
      }
    });
  }
}
