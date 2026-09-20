import { TestBed } from '@angular/core/testing';
import { Task } from '../../../core/models/task.model';
import { TaskCard } from './task-card';

const assignee = { id: 'user-002', name: 'Sarah Smith', avatar: 'SS', email: 'sarah@company.com' };

function fixtureTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Design homepage',
    description: 'Create wireframes and mockups',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-09-25',
    assignee,
    tags: ['Design'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TaskCard', () => {
  function createComponent(task: Task, mutationPending = false) {
    const fixture = TestBed.createComponent(TaskCard);
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('mutationPending', mutationPending);
    fixture.detectChanges();
    return fixture;
  }

  function kebabButton(fixture: ReturnType<typeof createComponent>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-haspopup="menu"]');
  }

  function openMenu(fixture: ReturnType<typeof createComponent>): void {
    kebabButton(fixture).click();
    fixture.detectChanges();
  }

  /** Clicks a popup menu item by its label; the actual click handler lives on the item's inner content element, not the `role="menuitem"` <li> itself. */
  function clickMenuItem(fixture: ReturnType<typeof createComponent>, text: string): void {
    const items: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
    );
    const item = items.find((el) => el.textContent?.trim() === text)!;
    const content = item.querySelector<HTMLElement>('.p-menu-item-content')!;
    content.click();
  }

  it('renders title, description, tag, priority and due-date label', () => {
    const fixture = createComponent(fixtureTask());
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Design homepage');
    expect(text).toContain('Create wireframes and mockups');
    expect(text).toContain('Design');
    expect(text).toContain('high');
    expect(text).toMatch(/Due in \d+ days|Due today|Due tomorrow/);
  });

  it('shows the assignee as "@FirstName" visually and the full name accessibly', () => {
    const fixture = createComponent(fixtureTask());

    expect(fixture.nativeElement.textContent).toContain('@Sarah');
    expect(fixture.nativeElement.textContent).not.toContain('Sarah Smith');

    const assigneeRow: HTMLElement = fixture.nativeElement.querySelector(
      '[aria-label^="Assigned to"]',
    );
    expect(assigneeRow.getAttribute('aria-label')).toBe('Assigned to Sarah Smith');
  });

  it('applies the overdue background and accent border for a genuinely overdue task', () => {
    const fixture = createComponent(fixtureTask({ status: 'in_progress', dueDate: '2020-01-01' }));
    const card: HTMLElement = fixture.nativeElement.querySelector('div');

    expect(card.classList.contains('bg-overdue-bg')).toBe(true);
    expect(card.classList.contains('border-overdue')).toBe(true);
  });

  it('does not apply the overdue treatment to a task that is not overdue', () => {
    const fixture = createComponent(fixtureTask({ dueDate: '2099-01-01' }));
    const card: HTMLElement = fixture.nativeElement.querySelector('div');

    expect(card.classList.contains('bg-overdue-bg')).toBe(false);
    expect(card.classList.contains('bg-white')).toBe(true);
  });

  it.each([
    ['high', 'text-priority-high-text'],
    ['medium', 'text-priority-medium-text'],
    ['low', 'text-priority-low-text'],
  ] as const)('applies the "%s" priority class', (priority, expectedClass) => {
    const fixture = createComponent(fixtureTask({ priority }));
    const chip: HTMLElement = fixture.nativeElement.querySelector(`.${expectedClass}`);

    expect(chip).toBeTruthy();
  });

  it('omits the tag line when the task has no tags', () => {
    const fixture = createComponent(fixtureTask({ title: 'Prepare budget report', tags: [] }));

    expect(fixture.nativeElement.textContent).not.toContain('Design');
  });

  it('names the kebab trigger after the specific task', () => {
    const fixture = createComponent(fixtureTask({ title: 'Design homepage' }));

    expect(kebabButton(fixture).getAttribute('aria-label')).toBe('Actions for Design homepage');
  });

  it('emits editRequested with the task and the kebab button as the trigger', () => {
    const task = fixtureTask();
    const fixture = createComponent(task);
    const emitted = vi.fn();
    fixture.componentInstance.editRequested.subscribe(emitted);

    openMenu(fixture);
    clickMenuItem(fixture, 'Edit');

    expect(emitted).toHaveBeenCalledWith({ task, trigger: kebabButton(fixture) });
  });

  it('emits deleteRequested with the task and the kebab button as the trigger', () => {
    const task = fixtureTask();
    const fixture = createComponent(task);
    const emitted = vi.fn();
    fixture.componentInstance.deleteRequested.subscribe(emitted);

    openMenu(fixture);
    clickMenuItem(fixture, 'Delete');

    expect(emitted).toHaveBeenCalledWith({ task, trigger: kebabButton(fixture) });
  });

  it('disables the kebab trigger while a mutation is pending', () => {
    const fixture = createComponent(fixtureTask(), true);

    expect(kebabButton(fixture).disabled).toBe(true);
  });

  it('does not wrap the kebab/menu in a CSS-positioned ancestor', () => {
    // PrimeNG Menu computes its popup's top/left as document-origin-relative
    // pixel offsets (absolutePosition() in @primeuix/utils), assuming no
    // intermediate `position: relative/absolute/fixed` ancestor between the
    // trigger and the document root. Such an ancestor becomes the popup's
    // offsetParent instead, making it render far from the trigger (a real
    // bug caught in manual QA: the culprit was a `class="relative"` on the
    // kebab's own wrapper).
    const fixture = createComponent(fixtureTask());
    let node: HTMLElement | null = kebabButton(fixture).parentElement;

    while (node && node !== fixture.nativeElement) {
      expect(node.className).not.toMatch(/\b(relative|absolute|fixed|sticky)\b/);
      node = node.parentElement;
    }
  });
});
