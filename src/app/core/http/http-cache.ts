import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Shared in-memory GET-response cache, keyed by full request URL. Directly
 * injected by both `cacheInterceptor` (read/write) and `TaskStore`
 * (invalidation); no event bus, since there's exactly one producer of
 * invalidation and one consumer of the cache.
 */
@Injectable({ providedIn: 'root' })
export class HttpCache {
  private readonly store = new Map<string, HttpResponse<unknown>>();

  get(url: string): HttpResponse<unknown> | undefined {
    return this.store.get(url);
  }

  set(url: string, response: HttpResponse<unknown>): void {
    this.store.set(url, response);
  }

  delete(url: string): void {
    this.store.delete(url);
  }
}
