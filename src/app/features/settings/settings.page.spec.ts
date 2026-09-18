import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  let fixture: ComponentFixture<SettingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
  });

  it('renders its placeholder heading and explanatory text', () => {
    const heading: HTMLHeadingElement = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent?.trim()).toBe('Settings');
    expect(fixture.nativeElement.textContent).toContain(
      'No functionality is specified for this page in the assignment',
    );
  });
});
