import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StatisticsService } from './statistics.service';

function flushMacrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('StatisticsService', () => {
  let httpMock: HttpTestingController;
  let service: StatisticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests GET /api/statistics and exposes the result', async () => {
    const statistics = [
      {
        id: 'stat-001',
        title: 'Total Tasks',
        icon: '📊',
        value: 17,
        change: '+12',
        changeLabel: 'this week',
        changeType: 'positive' as const,
        color: '#1976D2',
      },
    ];

    await flushMacrotask();
    const req = httpMock.expectOne('/api/statistics');
    expect(req.request.method).toBe('GET');
    req.flush(statistics);
    await flushMacrotask();

    expect(service.statistics.value()).toEqual(statistics);
  });
});
