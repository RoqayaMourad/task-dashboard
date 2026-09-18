import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NotFoundPage } from './not-found.page';

@Component({ selector: 'app-stub-dashboard', template: '' })
class StubDashboardPage {}

describe('NotFoundPage', () => {
  let fixture: ComponentFixture<NotFoundPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [provideRouter([{ path: 'dashboard', component: StubDashboardPage }])],
    }).compileComponents();
    fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
  });

  it('renders its heading and message', () => {
    const heading: HTMLHeadingElement = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent?.trim()).toBe('Page not found');
    expect(fixture.nativeElement.textContent).toContain(
      "The page you're looking for doesn't exist.",
    );
  });

  it('navigates back to /dashboard when the link is activated', async () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.getAttribute('href')).toBe('/dashboard');

    link.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
