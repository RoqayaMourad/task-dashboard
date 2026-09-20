import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Assignee } from '../models/task.model';

/** Thin singleton wrapper over GET /api/users: no filters, no mutations. */
@Injectable({ providedIn: 'root' })
export class UserService {
  readonly users = httpResource<Assignee[]>(() => '/api/users', { defaultValue: [] });
}
