import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpCache } from './http-cache';

/**
 * The only GET endpoints this interceptor caches. Deliberately explicit —
 * a future endpoint is NOT cached automatically just by being a GET; it has
 * to be added here on purpose.
 */
const CACHEABLE_GET_PATHS = new Set(['/api/tasks', '/api/statistics', '/api/users']);

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !CACHEABLE_GET_PATHS.has(req.url)) {
    return next(req);
  }

  const cache = inject(HttpCache);
  const cached = cache.get(req.urlWithParams);
  if (cached) {
    return of(cached.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(req.urlWithParams, event.clone());
      }
    }),
  );
};
