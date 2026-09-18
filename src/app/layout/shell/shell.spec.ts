import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

@Component({ selector: 'app-stub-page', template: '' })
class StubPage {}

describe('Shell', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([{ path: '**', component: StubPage }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    const toggleButton = fixture.nativeElement.querySelector('header button') as HTMLButtonElement;
    const panel = () => fixture.nativeElement.querySelector('aside') as HTMLElement;
    const backdrop = () =>
      fixture.nativeElement.querySelector('[aria-hidden="true"].fixed.inset-0');
    return { fixture, toggleButton, panel, backdrop };
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
});
