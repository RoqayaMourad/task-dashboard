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
  /** Decorative emoji glyph, matches the Figma source's icon treatment (Phase 18). */
  icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Tasks', path: '/tasks', icon: '✅' },
  { label: 'Calendar', path: '/calendar', icon: '📅' },
  { label: 'Analytics', path: '/analytics', icon: '📈' },
  { label: 'Team', path: '/team', icon: '👥' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

/**
 * Primary navigation. Below the `lg` breakpoint it doubles as an off-canvas
 * drawer: `open` toggles plain `hidden`/`flex` classes (native `display: none`
 * already removes hidden content from the tab order and a11y tree, no `inert`
 * or JS breakpoint tracking needed), while `lg:flex` unconditionally keeps it
 * visible on desktop regardless of `open`.
 *
 * The "+ New Task" CTA is a plain `routerLink`/`queryParams` link to
 * `/tasks?new`. Sidebar has no knowledge of `TaskFormDialog`/`TaskStore` at
 * all, the same as any other nav link. `TaskBoardPage` is solely responsible
 * for interpreting that one-shot query-param intent (see its own docs).
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
    // Move focus into the drawer when it opens (mobile only; the panel is
    // only reachable via the topbar's toggle button, which is itself hidden
    // on desktop, so this never fires outside a mobile "open" interaction).
    effect(() => {
      if (this.open()) {
        this.panel()?.nativeElement.focus();
      }
    });
  }
}
