export function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== 'string') return '';
  let decoded = str;
  // Recursively decode in case of double/triple encoding (&amp;amp; -> &amp; -> &)
  while (/&(amp|lt|gt|quot|#x27|#39|#x2F|#47);/i.test(decoded)) {
    const next = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#47;/g, '/');
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

export function sanitizeInput(str: string): string {
  if (typeof str !== 'string') return '';
  if (str.startsWith('data:image/')) return str;
  // First decode any previously encoded HTML entities so double-encoding never occurs
  const decoded = decodeHtmlEntities(str);
  return decoded
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function isValidUkMobile(phone: string | null | undefined): boolean {
  if (!phone || !phone.trim()) return true;
  const cleaned = phone.trim().replace(/[\s\-\(\)\+\.]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}
