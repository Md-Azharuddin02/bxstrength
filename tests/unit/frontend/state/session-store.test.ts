// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

export class SessionStore {
  static setSession(user: any, token: string) {
    localStorage.setItem('velocity_user', JSON.stringify(user));
    localStorage.setItem('velocity_jwt_token', token);
  }

  static getSession() {
    const userRaw = localStorage.getItem('velocity_user');
    const token = localStorage.getItem('velocity_jwt_token');
    return {
      user: userRaw ? JSON.parse(userRaw) : null,
      token,
    };
  }

  static clearSession() {
    localStorage.removeItem('velocity_user');
    localStorage.removeItem('velocity_jwt_token');
  }
}

describe('Unit: Frontend Session Store State', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('FE-STATE-01: Correctly stores and restores active user session', () => {
    const dummyUser = { id: 'u1', email: 'athlete@bxstrength.com', role: 'client' };
    const dummyToken = 'jwt_sample_token';

    SessionStore.setSession(dummyUser, dummyToken);

    const session = SessionStore.getSession();
    expect(session.user).toEqual(dummyUser);
    expect(session.token).toBe(dummyToken);
  });

  it('FE-STATE-02: Clears user session completely upon logout', () => {
    SessionStore.setSession({ id: 'u2' }, 'jwt_val');
    SessionStore.clearSession();

    const session = SessionStore.getSession();
    expect(session.user).toBeNull();
    expect(session.token).toBeNull();
  });
});
