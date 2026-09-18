/**
 * Structural contract for a routed page that owns its own search state.
 * Lets Shell forward Topbar search input to the active route without
 * injecting that page's store directly — scoped to the Topbar search
 * integration only, not a general routed-component capability framework.
 */
export interface RouteSearchable {
  setSearchTerm(term: string): void;
}

export function isRouteSearchable(component: unknown): component is RouteSearchable {
  return !!component && typeof (component as Partial<RouteSearchable>).setSearchTerm === 'function';
}
