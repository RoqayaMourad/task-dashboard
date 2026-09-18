import { HttpErrorResponse } from '@angular/common/http';
import { mutationErrorMessage } from './mutation-error-message';

describe('mutationErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(mutationErrorMessage(undefined)).toBeNull();
  });

  it('includes the status code for an HttpErrorResponse', () => {
    expect(mutationErrorMessage(new HttpErrorResponse({ status: 500 }))).toBe(
      'Something went wrong (500). Please try again.',
    );
  });

  it('falls back to a generic message for a plain Error, with no status to report', () => {
    expect(mutationErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
