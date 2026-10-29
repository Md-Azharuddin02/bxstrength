/**
 * Mobile phone validation. BxStrength serves UK clients only, so only UK mobiles are accepted.
 */

export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone || !phone.trim()) return true;
  const cleaned = phone.trim().replace(/[\s\-\(\)\+\.]/g, '');
  return /^\d{7,15}$/.test(cleaned);
};

// UK mobiles: 07xxx xxxxxx, +44 7xxx xxxxxx, 0044 7xxx xxxxxx (also tolerates +44 (0)7xxx…)
export const isValidUkMobile = (phone: string | null | undefined): boolean => {
  if (!phone || !phone.trim()) return true;
  const cleaned = phone.trim().replace(/[\s\-\(\)\+\.]/g, '');
  return /^(?:07\d{9}|447\d{9}|4407\d{9}|00447\d{9})$/.test(cleaned);
};

export const UK_PHONE_ERROR_MSG = 'Please enter a valid UK mobile number, e.g. 07911 123456 or +44 7911 123456.';
export const PHONE_ERROR_MSG = 'Please enter a valid mobile phone number (7 to 15 digits).';
