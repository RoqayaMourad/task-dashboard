import { daysBetween, parseDateOnly, startOfLocalDay } from './local-date';

describe('parseDateOnly', () => {
  it('parses a date-only string as local midnight, not UTC midnight', () => {
    const date = parseDateOnly('2026-09-20');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(20);
    expect(date.getHours()).toBe(0);
  });
});

describe('startOfLocalDay', () => {
  it('strips the time-of-day, keeping the local calendar date', () => {
    const start = startOfLocalDay(new Date(2026, 8, 18, 23, 59));
    expect(start).toEqual(new Date(2026, 8, 18, 0, 0, 0, 0));
  });
});

describe('daysBetween', () => {
  it('is 0 for the same calendar day regardless of time-of-day', () => {
    const from = new Date(2026, 8, 18, 0, 1);
    const to = new Date(2026, 8, 18, 23, 59);
    expect(daysBetween(from, to)).toBe(0);
  });

  it('is positive when `to` is later', () => {
    expect(daysBetween(new Date(2026, 8, 18), new Date(2026, 8, 21))).toBe(3);
  });

  it('is negative when `to` is earlier', () => {
    expect(daysBetween(new Date(2026, 8, 21), new Date(2026, 8, 18))).toBe(-3);
  });

  it('is not thrown off by a spring-forward DST transition between the two days', () => {
    // US DST 2026 spring-forward: 2026-03-08. A naive raw-ms/24h diff across
    // this boundary would undercount by the lost hour on a machine in that zone.
    expect(daysBetween(new Date(2026, 2, 7), new Date(2026, 2, 9))).toBe(2);
  });
});
