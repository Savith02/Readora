export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/**
 * The first thing wrong with a password someone is choosing, or undefined when it is fine.
 * Mirrors the backend's rules (backend/src/validators/auth.validators.ts) so mistakes show up
 * before a request is sent.
 */
export function passwordProblem(password: string): string | undefined {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must include a letter';
  if (!/\d/.test(password)) return 'Password must include a number';
  return undefined;
}
