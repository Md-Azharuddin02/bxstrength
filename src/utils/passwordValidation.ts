export function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password needs at least one uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password needs at least one lowercase letter';
    if (!/\d/.test(pw)) return 'Password needs at least one number';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password needs at least one special character';
    return null;
  }