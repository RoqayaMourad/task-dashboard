import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'Dashboard · Task Manager',
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-board.page').then((m) => m.TaskBoardPage),
        title: 'Tasks · Task Manager',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.page').then((m) => m.AnalyticsPage),
        title: 'Analytics · Task Manager',
      },
      {
        path: 'team',
        loadComponent: () => import('./features/team/team.page').then((m) => m.TeamPage),
        title: 'Team · Task Manager',
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar.page').then((m) => m.CalendarPage),
        title: 'Calendar · Task Manager',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
        title: 'Settings · Task Manager',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
    title: 'Not found · Task Manager',
  },
];
