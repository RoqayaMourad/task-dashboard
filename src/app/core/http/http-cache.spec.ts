import { HttpResponse } from '@angular/common/http';
import { HttpCache } from './http-cache';

describe('HttpCache', () => {
  it('returns undefined for a url that was never cached', () => {
    const cache = new HttpCache();
    expect(cache.get('/api/tasks')).toBeUndefined();
  });

  it('stores and retrieves a response by url', () => {
    const cache = new HttpCache();
    const response = new HttpResponse({ body: [1, 2, 3] });
    cache.set('/api/tasks', response);
    expect(cache.get('/api/tasks')).toBe(response);
  });

  it('deletes a cached entry', () => {
    const cache = new HttpCache();
    cache.set('/api/tasks', new HttpResponse({ body: [] }));
    cache.delete('/api/tasks');
    expect(cache.get('/api/tasks')).toBeUndefined();
  });

  it('keeps entries for other urls independent of a delete', () => {
    const cache = new HttpCache();
    cache.set('/api/tasks', new HttpResponse({ body: [] }));
    cache.set('/api/statistics', new HttpResponse({ body: [] }));
    cache.delete('/api/tasks');
    expect(cache.get('/api/statistics')).toBeDefined();
  });
});
