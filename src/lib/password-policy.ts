export const MIN_PASSWORD_LENGTH = 11;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordValidationError =
  | 'length'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'special'
  | null;

export function getPasswordValidationError(password: string): PasswordValidationError {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return 'length';
  }
  if (!/[A-Z]/.test(password)) return 'uppercase';
  if (!/[a-z]/.test(password)) return 'lowercase';
  if (!/[0-9]/.test(password)) return 'number';
  if (!/[^A-Za-z0-9\s]/.test(password)) return 'special';
  return null;
}

export function validatePassword(password: string) {
  return getPasswordValidationError(password) === null;
}
