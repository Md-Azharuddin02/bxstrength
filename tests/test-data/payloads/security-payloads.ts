export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1 UNION SELECT 1, 'admin', 'hacked@bxstrength.com', 'hash', 'admin' --",
  "admin' --",
  "' OR 1=1 --",
];

export const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg onload=alert(document.cookie)>',
  '"><script>alert(1)</script>',
];

export const massAssignmentPayloads = [
  { role: 'admin' },
  { is_verified: true },
  { status: 'active' },
  { isApproved: true },
  { isPublished: true },
  { permissions: ['*'] },
];

export const pathTraversalPayloads = [
  '../../../../etc/passwd',
  '..\\..\\..\\windows\\win.ini',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
];
