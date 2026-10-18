import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateTestToken,
  generateExpiredToken,
  generateInvalidSignatureToken,
  hashPassword,
  verifyPassword
} from '../../../helpers/auth-helpers';

describe('Unit: Backend Auth & JWT Handling', () => {
  const secret = process.env.JWT_SECRET || 'bxstrength_super_secret_jwt_key_2026_test';

  it('UT-AUTH-01: Generates and verifies valid JWT token with user claims', () => {
    const payload = { id: 'usr_unit_1', email: 'test@bxstrength.com', role: 'client' as const };
    const token = generateTestToken(payload);

    const decoded = jwt.verify(token, secret) as any;
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('UT-AUTH-02: Throws TokenExpiredError for expired tokens', () => {
    const payload = { id: 'usr_unit_2', email: 'expired@bxstrength.com', role: 'client' as const };
    const expiredToken = generateExpiredToken(payload);

    expect(() => {
      jwt.verify(expiredToken, secret);
    }).toThrow();
  });

  it('UT-AUTH-03: Throws JsonWebTokenError for tokens signed with invalid secret', () => {
    const payload = { id: 'usr_unit_3', email: 'tampered@bxstrength.com', role: 'admin' as const };
    const invalidToken = generateInvalidSignatureToken(payload);

    expect(() => {
      jwt.verify(invalidToken, secret);
    }).toThrow();
  });

  it('UT-AUTH-04: Securely hashes password and verifies valid password match', async () => {
    const plain = 'SuperSecretStrength2026!';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);

    const isMatch = await verifyPassword(plain, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword('WrongPassword', hash);
    expect(isBadMatch).toBe(false);
  });
});
