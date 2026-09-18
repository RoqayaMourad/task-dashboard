import { TestBed } from '@angular/core/testing';
import { Assignee } from '../../../core/models/task.model';
import { TaskFiltersBar } from './task-filters-bar';

const assignees: Assignee[] = [
  { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john@company.com' },
  { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 'sarah@company.com' },
];

describe('TaskFiltersBar', () => {
  function createComponent(
    overrides: {
      statusFilter?: string;
      priorityFilter?: string;
      assigneeFilter?: string;
      assigneeOptions?: Assignee[];
      assigneeOptionsStatus?: string;
    } = {},
  ) {
    const fixture = TestBed.createComponent(TaskFiltersBar);
    fixture.componentRef.setInput('statusFilter', overrides.statusFilter ?? 'all');
    fixture.componentRef.setInput('priorityFilter', overrides.priorityFilter ?? 'all');
    fixture.componentRef.setInput('assigneeFilter', overrides.assigneeFilter ?? 'all');
    fixture.componentRef.setInput('assigneeOptions', overrides.assigneeOptions ?? assignees);
    fixture.componentRef.setInput(
      'assigneeOptionsStatus',
      overrides.assigneeOptionsStatus ?? 'resolved',
    );
    fixture.detectChanges();
    return fixture;
  }

  it('marks the selected status button with aria-pressed, not a tab role', () => {
    const fixture = createComponent({ statusFilter: 'todo' });
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const allBtn = buttons.find((b) => b.textContent?.trim() === 'All')!;
    const todoBtn = buttons.find((b) => b.textContent?.trim() === 'To Do')!;

    expect(todoBtn.getAttribute('aria-pressed')).toBe('true');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.nativeElement.querySelector('[role="tablist"]')).toBeNull();
  });

  it('emits statusFilterChange when a status button is clicked', () => {
    const fixture = createComponent();
    const emitted = vi.fn();
    fixture.componentInstance.statusFilterChange.subscribe(emitted);

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const doneBtn = buttons.find((b) => b.textContent?.trim() === 'Done')!;
    doneBtn.click();

    expect(emitted).toHaveBeenCalledWith('done');
  });

  it('emits priorityFilterChange when the priority select changes', () => {
    const fixture = createComponent();
    const emitted = vi.fn();
    fixture.componentInstance.priorityFilterChange.subscribe(emitted);

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#priority-filter');
    select.value = 'high';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toHaveBeenCalledWith('high');
  });

  it('lists resolved assignee options and emits assigneeFilterChange on selection', () => {
    const fixture = createComponent();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#assignee-filter');
    expect(select.disabled).toBe(false);
    expect(select.options.length).toBe(3); // All + 2 assignees

    const emitted = vi.fn();
    fixture.componentInstance.assigneeFilterChange.subscribe(emitted);
    select.value = 'user-002';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toHaveBeenCalledWith('user-002');
  });

  it('disables the assignee select and shows a loading placeholder while options are loading', () => {
    const fixture = createComponent({ assigneeOptionsStatus: 'loading' });
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#assignee-filter');

    expect(select.disabled).toBe(true);
    expect(select.textContent).toContain('Loading assignees');
  });

  it('disables the assignee select and shows an unavailable message on error', () => {
    const fixture = createComponent({ assigneeOptionsStatus: 'error' });
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#assignee-filter');

    expect(select.disabled).toBe(true);
    expect(select.textContent).toContain('unavailable');
  });

  it('selects the matching option when created with a persisted non-default assignee filter', () => {
    const fixture = createComponent({ assigneeFilter: 'user-002' });
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#assignee-filter');

    expect(select.value).toBe('user-002');
  });

  it('renders the New Task trigger as genuinely disabled, not fake-interactive', () => {
    const fixture = createComponent();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[title*="Increment 3"]',
    );

    expect(button.disabled).toBe(true);
  });
});
