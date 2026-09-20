import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Statistic } from '../models/statistic.model';

/** Thin singleton wrapper over GET /api/statistics: no filters, no mutations. */
@Injectable({ providedIn: 'root' })
export class StatisticsService {
  readonly statistics = httpResource<Statistic[]>(() => '/api/statistics', { defaultValue: [] });
}
