/**
 * Mobile phone validation. BxStrength serves the UK and India (and accepts any valid
 * international mobile), so numbers are validated with libphonenumber-js.
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone || !phone.trim()) return true;
  const cleaned = phone.trim().replace(/[\s\-\(\)\+\.]/g, '');
  return /^\d{7,15}$/.test(cleaned);
};

// Accepts any valid international mobile (expects a leading + and dial code, which the
// PhoneInput component always supplies). Empty is allowed so callers decide if it's required.
export const isValidMobile = (phone: string | null | undefined): boolean => {
  if (!phone || !phone.trim()) return true;
  const parsed = parsePhoneNumberFromString(phone.trim());
  return !!parsed?.isValid();
};

// Back-compat alias: existing callers kept their import name while the rule widened to international.
export const isValidUkMobile = isValidMobile;

export const PHONE_ERROR_MSG =
  'Please enter a valid mobile number including the country code, e.g. +44 7911 123456 or +91 98765 43210.';
// Back-compat alias for the old constant name.
export const UK_PHONE_ERROR_MSG = PHONE_ERROR_MSG;
