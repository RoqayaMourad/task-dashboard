import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouteSearchable } from './route-searchable';
import { Shell } from './shell';
import { Topbar } from './topbar/topbar';

@Component({ selector: 'app-stub-page', template: '' })
class StubPage {}

@Component({ selector: 'app-stub-searchable-page', template: '' })
class StubSearchablePage implements RouteSearchable {
  received: string[] = [];
  setSearchTerm(term: string): void {
    this.received.push(term);
  }
}

describe('Shell', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([
          { path: 'searchable', component: StubSearchablePage },
          { path: '**', component: StubPage },
        ]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    const toggleButton = fixture.nativeElement.querySelector('header button') as HTMLButtonElement;
    const panel = () => fixture.nativeElement.querySelector('aside') as HTMLElement;
    const backdrop = () =>
      fixture.nativeElement.querySelector('[aria-hidden="true"].fixed.inset-0');
    const searchInput = () =>
      fixture.nativeElement.querySelector('input[aria-label="Search tasks"]') as HTMLInputElement;
    return { fixture, toggleButton, panel, backdrop, searchInput };
  }

  async function navigateTo(fixture: ComponentFixture<Shell>, path: string): Promise<void> {
    const router = TestBed.inject(Router);
    await router.navigateByUrl(path);
    fixture.detectChanges();
  }

  it('should create', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with the sidebar closed and no backdrop', async () => {
    const { panel, backdrop } = await setup();
    expect(panel().classList.contains('hidden')).toBe(true);
    expect(backdrop()).toBeNull();
  });

  it('should open the sidebar and show a backdrop when the toggle button is clicked', async () => {
    const { fixture, toggleButton, panel, backdrop } = await setup();

    toggleButton.click();
    fixture.detectChanges();

    expect(panel().classList.contains('flex')).toBe(true);
    expect(backdrop()).not.toBeNull();
  });

  it('should do nothing on Escape when the sidebar is already closed', async () => {
    const { fixture, panel } = await setup();
    expect(panel().classList.contains('hidden')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(panel().classList.contains('hidden')).toBe(true);
  });

  it('should close on Escape and return focus to the toggle button', async () => {
    const { fixture, toggleButton, panel } = await setup();
    toggleButton.click();
    fixture.detectChanges();
    expect(panel().classList.contains('flex')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(panel().classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(toggleButton);
  });

  it('should close when the toggle button is clicked again while open', async () => {
    const { fixture, toggleButton, panel } = await setup();

    toggleButton.click();
    fixture.detectChanges();
    expect(panel().classList.contains('flex')).toBe(true);

    toggleButton.click();
    fixture.detectChanges();

    expect(panel().classList.contains('hidden')).toBe(true);
    expect(document.activeElement).toBe(toggleButton);
  });

  it('should close when the backdrop is clicked', async () => {
    const { fixture, toggleButton, panel, backdrop } = await setup();
    toggleButton.click();
    fixture.detectChanges();

    (backdrop() as HTMLElement).click();
    fixture.detectChanges();

    expect(panel().classList.contains('hidden')).toBe(true);
    expect(backdrop()).toBeNull();
  });

  it('should close when a nav link is activated', async () => {
    const { fixture, toggleButton, panel } = await setup();
    toggleButton.click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('a[href="/tasks"]') as HTMLAnchorElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(panel().classList.contains('hidden')).toBe(true);
  });

  it('should enable Topbar search when a RouteSearchable route activates', async () => {
    const { fixture, searchInput } = await setup();
    expect(searchInput().disabled).toBe(true);

    await navigateTo(fixture, '/searchable');

    expect(searchInput().disabled).toBe(false);
  });

  it('should forward Topbar search input to the active RouteSearchable component', async () => {
    const { fixture, searchInput } = await setup();
    await navigateTo(fixture, '/searchable');
    const page = fixture.debugElement.query(By.directive(StubSearchablePage))
      .componentInstance as StubSearchablePage;

    searchInput().value = 'homepage';
    searchInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(page.received).toEqual(['homepage']);
  });

  it('should disable and clear Topbar search when the searchable route deactivates', async () => {
    const { fixture, searchInput } = await setup();
    await navigateTo(fixture, '/searchable');
    searchInput().value = 'homepage';
    searchInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(searchInput().value).toBe('homepage');

    await navigateTo(fixture, '/other');

    expect(searchInput().disabled).toBe(true);
    expect(searchInput().value).toBe('');
  });

  it('should keep search disabled when the routed component is not RouteSearchable', async () => {
    const { fixture, searchInput } = await setup();

    await navigateTo(fixture, '/not-searchable');

    expect(searchInput().disabled).toBe(true);
  });

  it('should not error when a search event occurs without an active searchable route', async () => {
    const { fixture } = await setup();
    const topbar = fixture.debugElement.query(By.directive(Topbar)).componentInstance as Topbar;

    expect(() => {
      topbar.searchChange.emit('anything');
      fixture.detectChanges();
    }).not.toThrow();
  });
});
