import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Topbar } from './topbar';

describe('Topbar', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Topbar);
    fixture.detectChanges();
    const toggleButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, toggleButton };
  }

  it('should create', async () => {
    const { fixture } = await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should reflect sidebarOpen into aria-expanded on the toggle button', async () => {
    const { fixture, toggleButton } = await setup();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

    fixture.componentRef.setInput('sidebarOpen', true);
    fixture.detectChanges();

    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
  });

  it('should emit toggleSidebar when the toggle button is clicked', async () => {
    const { fixture, toggleButton } = await setup();
    const emitted = vi.fn();
    fixture.componentInstance.toggleSidebar.subscribe(emitted);

    toggleButton.click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });

  it('should move focus to the toggle button on focusToggleButton()', async () => {
    const { fixture, toggleButton } = await setup();
    toggleButton.focus();
    toggleButton.blur();
    expect(document.activeElement).not.toBe(toggleButton);

    fixture.componentInstance.focusToggleButton();

    expect(document.activeElement).toBe(toggleButton);
  });

  it('should render the search input disabled when searchEnabled is false', async () => {
    const { fixture } = await setup();
    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Search tasks"]',
    );

    expect(searchInput.disabled).toBe(true);
  });

  it('should enable the search input when searchEnabled is true', async () => {
    const { fixture } = await setup();
    fixture.componentRef.setInput('searchEnabled', true);
    fixture.detectChanges();

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Search tasks"]',
    );

    expect(searchInput.disabled).toBe(false);
  });

  it('should emit search with the typed value while enabled', async () => {
    const { fixture } = await setup();
    fixture.componentRef.setInput('searchEnabled', true);
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.searchChange.subscribe(emitted);

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Search tasks"]',
    );
    searchInput.value = 'homepage';
    searchInput.dispatchEvent(new Event('input'));

    expect(emitted).toHaveBeenCalledWith('homepage');
  });

  it('should clear the displayed search value on resetSearch()', async () => {
    const { fixture } = await setup();
    fixture.componentRef.setInput('searchEnabled', true);
    fixture.detectChanges();
    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Search tasks"]',
    );
    searchInput.value = 'homepage';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(searchInput.value).toBe('homepage');

    fixture.componentInstance.resetSearch();
    fixture.detectChanges();

    expect(searchInput.value).toBe('');
  });
});
