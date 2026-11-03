export function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return '';
  if (str.startsWith('data:image/')) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Accepts any valid international mobile. The client's PhoneInput always sends the number with
// its + dial code, so validation needs no default country. Empty is allowed (phone is optional).
export function isValidMobile(phone: string | null | undefined): boolean {
  if (!phone || !phone.trim()) return true;
  return !!parsePhoneNumberFromString(phone.trim())?.isValid();
}

// Back-compat alias: the rule widened from UK-only to international but callers kept the import name.
export const isValidUkMobile = isValidMobile;
