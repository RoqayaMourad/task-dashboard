import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

@Component({ selector: 'app-stub-page', template: '' })
class StubPage {}

describe('Sidebar', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([{ path: '**', component: StubPage }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    return { fixture, panel };
  }

  it('should create', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a link for each of the six nav items', async () => {
    const { fixture } = await setup();
    const links: NodeListOf<HTMLAnchorElement> =
      fixture.nativeElement.querySelectorAll('nav a[href]');
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      '/dashboard',
      '/tasks',
      '/calendar',
      '/analytics',
      '/team',
      '/settings',
    ]);
  });

  it('should be hidden (not tabbable) when closed and shown when open', async () => {
    const { fixture, panel } = await setup();
    expect(panel.classList.contains('hidden')).toBe(true);
    expect(panel.classList.contains('flex')).toBe(false);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    expect(panel.classList.contains('hidden')).toBe(false);
    expect(panel.classList.contains('flex')).toBe(true);
  });

  it('should emit navigated when a nav link is clicked', async () => {
    const { fixture } = await setup();
    const emitted = vi.fn();
    fixture.componentInstance.navigated.subscribe(emitted);

    (fixture.nativeElement.querySelector('a[href="/tasks"]') as HTMLAnchorElement).click();
    await fixture.whenStable();

    expect(emitted).toHaveBeenCalledTimes(1);
  });

  function newTaskCta(fixture: ComponentFixture<Sidebar>): HTMLAnchorElement {
    const links: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('a'));
    return links.find((a) => a.textContent?.includes('New Task'))!;
  }

  it('renders the New Task CTA as a link to /tasks carrying the new-task query intent', async () => {
    const { fixture } = await setup();
    const cta = newTaskCta(fixture);

    const href = cta.getAttribute('href')!;
    const { pathname, searchParams } = new URL(href, 'http://localhost');
    expect(pathname).toBe('/tasks');
    // Presence-checked by the consumer, never string/boolean-compared — see
    // TaskBoardPage's queryParamMap handling.
    expect(searchParams.has('new')).toBe(true);
  });

  it('should emit navigated when the New Task CTA is clicked, same as a nav link', async () => {
    const { fixture } = await setup();
    const emitted = vi.fn();
    fixture.componentInstance.navigated.subscribe(emitted);

    newTaskCta(fixture).click();
    await fixture.whenStable();

    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('should move focus into the panel when it opens', async () => {
    const { fixture, panel } = await setup();
    expect(document.activeElement).not.toBe(panel);

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(panel);
  });
});
