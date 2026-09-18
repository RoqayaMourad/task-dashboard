import { Route } from '@angular/router';
import { routes } from './app.routes';

/**
 * Structural assertions only — never invokes `loadComponent()`, so this
 * never triggers the dynamic `import()`s themselves (which would just
 * duplicate what each lazy page's own spec already builds/tests).
 */
describe('routes', () => {
  it('mounts the shell at the root and redirects "" to /dashboard', () => {
    const shellRoute = routes.find((route) => route.path === '');
    expect(shellRoute).toBeTruthy();
    expect(typeof shellRoute?.loadComponent).toBe('function');

    const redirect = shellRoute?.children?.find((child) => child.path === '');
    expect(redirect?.redirectTo).toBe('dashboard');
    expect(redirect?.pathMatch).toBe('full');
  });

  it('lazy-loads every feature path as a child of the shell', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const children = (shellRoute?.children ?? []) as Route[];
    const featurePaths = ['dashboard', 'tasks', 'analytics', 'team', 'calendar', 'settings'];

    for (const path of featurePaths) {
      const child = children.find((route) => route.path === path);
      expect(child, `expected a "${path}" child route`).toBeTruthy();
      expect(typeof child?.loadComponent).toBe('function');
    }
  });

  it('lazy-loads a wildcard Not Found route outside the shell', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(wildcard).toBeTruthy();
    expect(typeof wildcard?.loadComponent).toBe('function');
    // Deliberately a sibling of the shell route, not one of its children —
    // it must also catch a completely unknown top-level path.
    expect(routes.includes(wildcard!)).toBe(true);
    const shellRoute = routes.find((route) => route.path === '');
    expect(shellRoute?.children?.includes(wildcard!)).toBe(false);
  });
});
