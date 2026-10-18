import { describe, it, expect } from 'vitest';

export type UserRole = 'admin' | 'headcoach' | 'coach' | 'support' | 'client';

export const RoleHierarchy: Record<UserRole, number> = {
  admin: 100,
  headcoach: 80,
  coach: 60,
  support: 40,
  client: 10,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}

describe('Unit: Backend Role Permissions Matrix', () => {
  it('UT-ROLE-01: Admin has access to all operational tiers', () => {
    expect(hasPermission('admin', 'client')).toBe(true);
    expect(hasPermission('admin', 'support')).toBe(true);
    expect(hasPermission('admin', 'coach')).toBe(true);
    expect(hasPermission('admin', 'headcoach')).toBe(true);
    expect(hasPermission('admin', 'admin')).toBe(true);
  });

  it('UT-ROLE-02: Head Coach can oversee coaches and clients but not admin', () => {
    expect(hasPermission('headcoach', 'client')).toBe(true);
    expect(hasPermission('headcoach', 'coach')).toBe(true);
    expect(hasPermission('headcoach', 'admin')).toBe(false);
  });

  it('UT-ROLE-03: Coach cannot perform headcoach or admin operations', () => {
    expect(hasPermission('coach', 'client')).toBe(true);
    expect(hasPermission('coach', 'headcoach')).toBe(false);
    expect(hasPermission('coach', 'admin')).toBe(false);
  });

  it('UT-ROLE-04: Client has only base client privileges', () => {
    expect(hasPermission('client', 'client')).toBe(true);
    expect(hasPermission('client', 'coach')).toBe(false);
    expect(hasPermission('client', 'support')).toBe(false);
    expect(hasPermission('client', 'admin')).toBe(false);
  });
});
