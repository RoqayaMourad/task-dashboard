import { FormArray, FormControl } from '@angular/forms';
import { Assignee } from '../../../core/models/task.model';
import { assigneeExists, nonWhitespaceTitle, uniqueNonEmptyTags } from './task-form.validators';

function nonNullableControl(value: string): FormControl<string> {
  return new FormControl(value, { nonNullable: true });
}

describe('nonWhitespaceTitle', () => {
  it('passes a non-empty, non-whitespace title', () => {
    expect(nonWhitespaceTitle(nonNullableControl('Design homepage'))).toBeNull();
  });

  it('passes an empty title (Validators.required is responsible for that case)', () => {
    expect(nonWhitespaceTitle(nonNullableControl(''))).toBeNull();
  });

  it('fails a whitespace-only title', () => {
    expect(nonWhitespaceTitle(nonNullableControl('   '))).toEqual({ whitespaceTitle: true });
  });
});

describe('uniqueNonEmptyTags', () => {
  function tagsArray(values: string[]): FormArray<FormControl<string>> {
    return new FormArray(values.map((v) => new FormControl(v, { nonNullable: true })));
  }

  it('passes distinct, non-blank tags', () => {
    expect(uniqueNonEmptyTags(tagsArray(['Backend', 'Critical']))).toBeNull();
  });

  it('passes an empty tag list', () => {
    expect(uniqueNonEmptyTags(tagsArray([]))).toBeNull();
  });

  it('fails a blank tag', () => {
    expect(uniqueNonEmptyTags(tagsArray(['Backend', '  ']))).toEqual({ blankTag: true });
  });

  it('fails a case-insensitive duplicate', () => {
    expect(uniqueNonEmptyTags(tagsArray(['Backend', 'backend']))).toEqual({ duplicateTag: true });
  });
});

describe('assigneeExists', () => {
  const assignees: Assignee[] = [
    { id: 'user-001', name: 'John Doe', avatar: 'JD', email: 'john@company.com' },
  ];

  it('passes an empty value (Validators.required is responsible for that case)', () => {
    const validator = assigneeExists(
      () => assignees,
      () => 'resolved',
    );
    expect(validator(nonNullableControl(''))).toBeNull();
  });

  it('passes an id present in the resolved options', () => {
    const validator = assigneeExists(
      () => assignees,
      () => 'resolved',
    );
    expect(validator(nonNullableControl('user-001'))).toBeNull();
  });

  it('fails an id absent from resolved options', () => {
    const validator = assigneeExists(
      () => assignees,
      () => 'resolved',
    );
    expect(validator(nonNullableControl('user-999'))).toEqual({ assigneeMissing: true });
  });

  it('does not flag a value while options are still loading', () => {
    const validator = assigneeExists(
      () => [],
      () => 'loading',
    );
    expect(validator(nonNullableControl('user-001'))).toBeNull();
  });
});
