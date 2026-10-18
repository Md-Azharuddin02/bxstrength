import { expect } from 'vitest';
import type { Response } from 'supertest';

/**
 * Ensures sensitive data like passwords, OTPs, or actual secret keys never appear in JSON response
 */
export function assertNoLeakedSecrets(responseBody: any) {
  const jsonStr = JSON.stringify(responseBody);
  const sensitivePatterns = [
    /password_hash/i,
    /"otp":\s*"[0-9]{4,6}"/i,
    /xkeysib-[a-zA-Z0-9_-]{20,}/i,
    /rzp_live_[a-zA-Z0-9]+/i,
    /postgres:\/\/[^:]+:[^@]+@/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(jsonStr)) {
      throw new Error(`Security Violation: Sensitive pattern ${pattern} detected in response output!`);
    }
  }
}

/**
 * Asserts essential HTTP security headers are present
 */
export function assertSecurityHeaders(res: Response) {
  expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['x-frame-options'] || res.headers['content-security-policy']).toBeDefined();
}

/**
 * Asserts error response contract
 */
export function assertErrorResponse(res: Response, expectedStatus: number, messageSubstring?: string) {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toHaveProperty('error');
  if (messageSubstring) {
    expect(res.body.error).toContain(messageSubstring);
  }
}
