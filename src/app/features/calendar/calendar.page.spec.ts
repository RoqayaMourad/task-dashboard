import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarPage } from './calendar.page';

describe('CalendarPage', () => {
  let fixture: ComponentFixture<CalendarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarPage);
    fixture.detectChanges();
  });

  it('renders its placeholder heading and explanatory text', () => {
    const heading: HTMLHeadingElement = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent?.trim()).toBe('Calendar');
    expect(fixture.nativeElement.textContent).toContain(
      'No functionality is specified for this page in the assignment',
    );
  });
});
