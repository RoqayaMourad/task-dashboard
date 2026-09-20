import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  output,
  ResourceStatus,
  signal,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import {
  Assignee,
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskStatus,
} from '../../../core/models/task.model';
import { mutationErrorMessage } from '../mutation-error-message';
import { assigneeExists, nonWhitespaceTitle, uniqueNonEmptyTags } from './task-form.validators';

type TaskForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  priority: FormControl<TaskPriority>;
  status: FormControl<TaskStatus>;
  dueDate: FormControl<string>;
  assigneeId: FormControl<string>;
  tags: FormArray<FormControl<string>>;
}>;

/**
 * Dumb: owns the reactive form only, no `TaskStore`/`UserService` injection.
 * One instance handles both Create and Edit; `TaskBoardPage` decides which
 * `TaskStore` method to call from the emitted `save` value. Stays mounted
 * for the page's lifetime; the form is (re)initialized from `task()`/`mode()`
 * each time `visible()` transitions to `true`, so a failed submit leaves
 * whatever the user typed untouched (the dialog just stays open).
 */
@Component({
  selector: 'app-task-form-dialog',
  imports: [Dialog, ReactiveFormsModule],
  templateUrl: './task-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormDialog {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly visible = input.required<boolean>();
  readonly mode = input.required<'create' | 'edit'>();
  readonly task = input<Task | null>(null);
  readonly assigneeOptions = input.required<Assignee[]>();
  readonly assigneeOptionsStatus = input.required<ResourceStatus>();
  readonly pending = input(false);
  readonly error = input<HttpErrorResponse | Error | undefined>(undefined);

  readonly save = output<CreateTaskInput>();
  readonly dismissed = output<void>();

  protected readonly newTagValue = signal('');
  protected readonly errorMessage = mutationErrorMessage;

  private readonly tagsArray = new FormArray<FormControl<string>>([], {
    validators: [uniqueNonEmptyTags],
  });

  protected readonly form: TaskForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nonWhitespaceTitle],
    }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl<TaskPriority>('medium', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<TaskStatus>('todo', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dueDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    assigneeId: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        assigneeExists(
          () => this.assigneeOptions(),
          () => this.assigneeOptionsStatus(),
        ),
      ],
    }),
    tags: this.tagsArray,
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.initializeForm(this.task());
      }
    });

    // Keeps assigneeId's enabled/disabled state and validity in sync with the
    // live options resource. Angular disallows [disabled] alongside
    // formControlName, so this is the control's own `disable()`/`enable()`.
    // Note a *disabled* control is excluded from `form.invalid`
    // entirely, which is why `canSubmit()` independently re-checks
    // `assigneeOptionsStatus() === 'resolved'` rather than trusting
    // `form.invalid` alone here.
    effect(() => {
      const status = this.assigneeOptionsStatus();
      this.assigneeOptions();
      if (status === 'loading' || status === 'error') {
        this.form.controls.assigneeId.disable({ emitEvent: false });
      } else {
        this.form.controls.assigneeId.enable({ emitEvent: false });
      }
      this.form.controls.assigneeId.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });
  }

  protected get tagControls(): FormControl<string>[] {
    return this.tagsArray.controls;
  }

  protected addTag(): void {
    const value = this.newTagValue().trim();
    if (!value) {
      return;
    }
    this.tagsArray.push(new FormControl(value, { nonNullable: true }));
    this.tagsArray.updateValueAndValidity();
    // A disabled Save button never fires (ngSubmit), so onSubmit()'s
    // markAllAsTouched() never runs while a duplicate/blank tag is exactly
    // what's keeping it disabled; mark touched right on the action that
    // could introduce the problem instead.
    this.tagsArray.markAsTouched();
    this.newTagValue.set('');
  }

  protected removeTag(index: number): void {
    this.tagsArray.removeAt(index);
    this.tagsArray.updateValueAndValidity();
    this.tagsArray.markAsTouched();
  }

  protected fieldInvalid(
    name: 'title' | 'description' | 'priority' | 'status' | 'dueDate',
  ): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  protected assigneeInvalid(): boolean {
    const control = this.form.controls.assigneeId;
    if (!control.invalid) {
      return false;
    }
    // A stale/missing assignee is an existing-data problem, not something the
    // user just typed; surface it immediately rather than waiting for touch.
    if (control.errors?.['assigneeMissing']) {
      return true;
    }
    return control.dirty || control.touched;
  }

  protected assigneeErrorMessage(): string | null {
    const errors = this.form.controls.assigneeId.errors;
    if (!errors) {
      return null;
    }
    if (errors['assigneeMissing']) {
      return 'This assignee is no longer available. Choose another.';
    }
    return 'Select an assignee.';
  }

  protected tagsInvalid(): boolean {
    return this.tagsArray.invalid && this.tagsArray.touched;
  }

  protected tagsErrorMessage(): string | null {
    const errors = this.tagsArray.errors;
    if (!errors) {
      return null;
    }
    if (errors['duplicateTag']) {
      return 'Tags must be unique.';
    }
    if (errors['blankTag']) {
      return 'Tags cannot be blank.';
    }
    return null;
  }

  protected canSubmit(): boolean {
    return !this.form.invalid && !this.pending() && this.assigneeOptionsStatus() === 'resolved';
  }

  protected onDialogVisibleChange(value: boolean): void {
    if (!value && !this.pending()) {
      this.dismissed.emit();
    }
  }

  protected onCancel(): void {
    if (this.pending()) {
      return;
    }
    this.dismissed.emit();
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    this.tagsArray.markAsTouched();
    if (!this.canSubmit()) {
      return;
    }

    const value = this.form.getRawValue();
    const assignee = this.assigneeOptions().find((option) => option.id === value.assigneeId);
    if (!assignee) {
      return;
    }

    this.save.emit({
      title: value.title.trim(),
      description: value.description.trim(),
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate,
      assignee,
      tags: value.tags,
    });
  }

  private initializeForm(task: Task | null): void {
    this.tagsArray.clear();
    for (const tag of task?.tags ?? []) {
      this.tagsArray.push(new FormControl(tag, { nonNullable: true }));
    }
    this.form.reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'todo',
      dueDate: task?.dueDate ?? '',
      assigneeId: task?.assignee.id ?? '',
    });
    this.newTagValue.set('');
  }
}
