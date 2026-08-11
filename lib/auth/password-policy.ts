export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;

export function passwordLengthMessage() {
  return `Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
}
