import { describe, it, expect } from 'vitest';
import type { UserRole } from '@/types';

export function getAllowedNavItems(role: UserRole | null): string[] {
  if (!role) {
    return ['Home', 'Services', 'Trainers', 'About', 'Pricing', 'Login'];
  }

  const baseItems = ['Home', 'Services', 'Trainers', 'Pricing'];

  switch (role) {
    case 'admin':
      return [...baseItems, 'Dashboard', 'CRM', 'Users', 'Coaches', 'Financials', 'Audit Logs'];
    case 'headcoach':
      return [...baseItems, 'Dashboard', 'Programs', 'Nutrition', 'Classes', 'Approvals'];
    case 'coach':
      return [...baseItems, 'Dashboard', 'Athletes', 'Workout Builder', 'Schedules'];
    case 'customer_support':
      return [...baseItems, 'Dashboard', 'Support Desk', 'Inquiries'];
    case 'client':
    default:
      return [...baseItems, 'Dashboard', 'My Workouts', 'Nutrition Plan', 'Bookings', 'Profile'];
  }
}

describe('Unit: Frontend Role-Based Navigation', () => {
  it('FE-NAV-01: Anonymous visitor only sees public pages and login', () => {
    const nav = getAllowedNavItems(null);
    expect(nav).toContain('Login');
    expect(nav).not.toContain('Dashboard');
    expect(nav).not.toContain('CRM');
  });

  it('FE-NAV-02: Admin navigation contains CRM, Financials, and Audit Logs', () => {
    const nav = getAllowedNavItems('admin');
    expect(nav).toContain('CRM');
    expect(nav).toContain('Financials');
    expect(nav).toContain('Audit Logs');
  });

  it('FE-NAV-03: Client navigation contains personal workouts and bookings', () => {
    const nav = getAllowedNavItems('client');
    expect(nav).toContain('My Workouts');
    expect(nav).toContain('Bookings');
    expect(nav).not.toContain('Audit Logs');
    expect(nav).not.toContain('CRM');
  });
});
