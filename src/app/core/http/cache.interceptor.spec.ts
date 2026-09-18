import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { cacheInterceptor } from './cache.interceptor';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('serves a repeated identical GET to an allowed endpoint from cache', async () => {
    const first = firstValueFrom(http.get('/api/tasks'));
    httpMock.expectOne('/api/tasks').flush([{ id: 't-1' }]);
    expect(await first).toEqual([{ id: 't-1' }]);

    const second = firstValueFrom(http.get('/api/tasks'));
    httpMock.expectNone('/api/tasks');
    expect(await second).toEqual([{ id: 't-1' }]);
  });

  it('does not cache a GET to an endpoint outside the allowlist', async () => {
    const first = firstValueFrom(http.get('/api/other'));
    httpMock.expectOne('/api/other').flush({ a: 1 });
    await first;

    const second = firstValueFrom(http.get('/api/other'));
    httpMock.expectOne('/api/other').flush({ a: 2 });
    expect(await second).toEqual({ a: 2 });
  });

  it('does not intercept non-GET requests to an allowed endpoint', async () => {
    const post = firstValueFrom(http.post('/api/tasks', { title: 'x' }));
    httpMock.expectOne({ url: '/api/tasks', method: 'POST' }).flush({ id: 't-1' });
    await post;

    const get = firstValueFrom(http.get('/api/tasks'));
    httpMock.expectOne({ url: '/api/tasks', method: 'GET' }).flush([{ id: 't-1' }]);
    await get;
  });
});
