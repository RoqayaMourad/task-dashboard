import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ResourceStatus } from '@angular/core';
import { Assignee } from '../../../core/models/task.model';

/** `Validators.required` alone lets a whitespace-only title through — this closes that gap. */
export function nonWhitespaceTitle(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value;
  if (typeof value === 'string' && value.length > 0 && value.trim().length === 0) {
    return { whitespaceTitle: true };
  }
  return null;
}

/** Array-level: rejects a blank entry or a case-insensitive duplicate among the tag `FormArray`'s controls. */
export function uniqueNonEmptyTags(control: AbstractControl): ValidationErrors | null {
  const values = (control.value ?? []) as string[];

  if (values.some((value) => value.trim().length === 0)) {
    return { blankTag: true };
  }

  const seen = new Set<string>();
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (seen.has(key)) {
      return { duplicateTag: true };
    }
    seen.add(key);
  }
  return null;
}

/**
 * Confirms the selected assignee id still exists in the live `UserService`
 * collection — `Validators.required` only proves the field isn't empty, not
 * that the id is still valid (e.g. a stale id from an edit-mode prefill).
 * Deliberately returns no error while `getStatus()` isn't `'resolved'`: with
 * an empty/incomplete options list we can't yet prove membership either way,
 * and flagging a perfectly valid prefilled assignee as missing just because
 * the list hasn't loaded yet would be a false positive.
 */
export function assigneeExists(
  getOptions: () => readonly Assignee[],
  getStatus: () => ResourceStatus,
): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;
    if (!value || getStatus() !== 'resolved') {
      return null;
    }
    const exists = getOptions().some((assignee) => assignee.id === value);
    return exists ? null : { assigneeMissing: true };
  };
}
