import { TestBed } from '@angular/core/testing';
import { ActivityItem } from '../activity';
import { ActivityFeed } from './activity-feed';

describe('ActivityFeed', () => {
  function createComponent(items: ActivityItem[]) {
    const fixture = TestBed.createComponent(ActivityFeed);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one list entry per activity item, worded by kind', () => {
    const fixture = createComponent([
      {
        taskId: 't-1',
        taskTitle: 'Design homepage',
        kind: 'created',
        at: '2026-09-01T00:00:00.000Z',
      },
      { taskId: 't-2', taskTitle: 'Ship release', kind: 'updated', at: '2026-09-02T00:00:00.000Z' },
    ]);

    const items: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Design homepage');
    expect(items[0].textContent).toContain('was created');
    expect(items[1].textContent).toContain('Ship release');
    expect(items[1].textContent).toContain('was updated');
  });

  it('shows a "No recent activity" message when items is empty', () => {
    const fixture = createComponent([]);

    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No recent activity');
  });
});
