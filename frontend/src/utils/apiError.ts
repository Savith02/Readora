import { isAxiosError } from 'axios';

export interface ApiErrorInfo {
  /** Something safe to show the user. */
  message: string;
  /** Per-field messages from the backend's validation, keyed by field name. */
  fields: Record<string, string>;
}

interface ErrorBody {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export function parseApiError(error: unknown): ApiErrorInfo {
  if (!isAxiosError<ErrorBody>(error)) return { message: 'Something went wrong. Please try again.', fields: {} };

  if (!error.response) {
    return { message: 'Cannot reach the server. Check your connection and try again.', fields: {} };
  }

  const { status, data } = error.response;
  const fields: Record<string, string> = {};
  for (const item of data?.errors ?? []) fields[item.field] ??= item.message; // first message per field

  const fallback = status >= 500 ? 'The server is not responding. Please try again in a moment.' : 'Something went wrong. Please try again.';
  return { message: data?.message ?? fallback, fields };
}
