import { HttpErrorResponse } from '@angular/common/http';

/** A short, user-facing message for a `TaskStore` mutation failure — never the raw error. */
export function mutationErrorMessage(error: HttpErrorResponse | Error | undefined): string | null {
  if (!error) {
    return null;
  }
  if (error instanceof HttpErrorResponse) {
    return `Something went wrong (${error.status}). Please try again.`;
  }
  return 'Something went wrong. Please try again.';
}
