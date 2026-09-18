import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Assignee } from '../../core/models/task.model';
import { TeamPage } from './team.page';

function flushMacrotask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const users: Assignee[] = [
  { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john.doe@company.com' },
  { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 'sarah.smith@company.com' },
];

describe('TeamPage', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<TeamPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(TeamPage);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushUsers(data: Assignee[]): Promise<void> {
    httpMock.expectOne('/api/users').flush(data);
    await flushMacrotask();
  }

  async function failUsers(): Promise<void> {
    httpMock.expectOne('/api/users').flush('boom', { status: 500, statusText: 'Server Error' });
    await flushMacrotask();
  }

  function skeletonCount(): number {
    return fixture.nativeElement.querySelectorAll('.animate-pulse').length;
  }

  function cards(): HTMLLIElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('li'));
  }

  it('shows a skeleton while users are loading', async () => {
    fixture.detectChanges();
    await flushMacrotask();

    expect(skeletonCount()).toBeGreaterThan(0);

    await flushUsers(users);
  });

  it('renders every resolved user’s name, email, and initials', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushUsers(users);
    fixture.detectChanges();

    expect(skeletonCount()).toBe(0);
    expect(cards().length).toBe(2);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('John Doe');
    expect(text).toContain('john.doe@company.com');
    expect(text).toContain('JD');
    expect(text).toContain('Sarah Smith');
    expect(text).toContain('sarah.smith@company.com');
    expect(text).toContain('SS');
  });

  it('shows an error with retry on failure, and recovers after retry', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await failUsers();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Retry loading team members"]',
    );
    retryButton.click();
    await flushMacrotask();

    await flushUsers(users);
    fixture.detectChanges();

    expect(cards().length).toBe(2);
  });

  it('shows an empty-state message instead of an empty grid when there are no users', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushUsers([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No team members yet');
    expect(cards().length).toBe(0);
  });

  it('hides the decorative avatar from assistive tech while keeping name/email as real accessible text', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushUsers(users);
    fixture.detectChanges();

    const firstCard = cards()[0];
    const avatar = firstCard.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(avatar.textContent?.trim()).toBe('JD');

    const visibleText = Array.from(firstCard.querySelectorAll('p'))
      .map((p) => p.textContent?.trim())
      .filter(Boolean);
    expect(visibleText).toEqual(['John Doe', 'john.doe@company.com']);
  });

  it('renders the grid as a native ul/li list, needing no redundant role="list"/"listitem"', async () => {
    fixture.detectChanges();
    await flushMacrotask();
    await flushUsers(users);
    fixture.detectChanges();

    const list: HTMLUListElement = fixture.nativeElement.querySelector('ul');
    expect(list.tagName).toBe('UL');
    expect(list.hasAttribute('role')).toBe(false);
    expect(cards().every((card) => card.tagName === 'LI' && !card.hasAttribute('role'))).toBe(true);
  });
});
