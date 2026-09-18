import { TestBed } from '@angular/core/testing';
import { Statistic } from '../../../core/models/statistic.model';
import { StatCard } from './stat-card';

function fixtureStatistic(overrides: Partial<Statistic> = {}): Statistic {
  return {
    id: 'stat-001',
    title: 'Total Tasks',
    icon: '📊',
    value: 156,
    change: '+12',
    changeLabel: 'this week',
    changeType: 'positive',
    color: '#1976D2',
    ...overrides,
  };
}

describe('StatCard', () => {
  function createComponent(statistic: Statistic) {
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('statistic', statistic);
    fixture.detectChanges();
    return fixture;
  }

  it('renders title, value, icon and change text from the statistic', () => {
    const fixture = createComponent(fixtureStatistic());
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Total Tasks');
    expect(text).toContain('156');
    expect(text).toContain('📊');
    expect(text).toContain('+12');
    expect(text).toContain('this week');
  });

  it('marks the icon as decorative for assistive technology', () => {
    const fixture = createComponent(fixtureStatistic());
    const icon: HTMLElement = fixture.nativeElement.querySelector('[aria-hidden="true"]');

    expect(icon.textContent?.trim()).toBe('📊');
  });

  it.each([
    ['positive', 'text-change-positive-text'],
    ['negative', 'text-change-negative'],
    ['neutral', 'text-change-neutral'],
  ] as const)('applies "%s" -> %s change coloring', (changeType, expectedClass) => {
    const fixture = createComponent(fixtureStatistic({ changeType }));
    const change: HTMLElement = fixture.nativeElement.querySelector(`.${expectedClass}`);

    expect(change).toBeTruthy();
  });
});
