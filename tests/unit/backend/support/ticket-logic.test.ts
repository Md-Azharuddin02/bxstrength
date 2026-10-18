import { describe, it, expect } from 'vitest';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export function canAccessTicket(ticket: SupportTicket, requestingUser: { id: string; role: string }): boolean {
  if (requestingUser.role === 'admin' || requestingUser.role === 'support') {
    return true;
  }
  return ticket.userId === requestingUser.id;
}

describe('Unit: Backend Support Ticket Ownership and Visibility', () => {
  const ticket: SupportTicket = {
    id: 'tkt_1001',
    userId: 'client_owner_123',
    subject: 'App sync query',
    status: 'open',
  };

  it('UT-TKT-01: Ticket creator can access their own ticket', () => {
    expect(canAccessTicket(ticket, { id: 'client_owner_123', role: 'client' })).toBe(true);
  });

  it('UT-TKT-02: Support team and Admin can access any ticket', () => {
    expect(canAccessTicket(ticket, { id: 'support_agent_1', role: 'support' })).toBe(true);
    expect(canAccessTicket(ticket, { id: 'admin_1', role: 'admin' })).toBe(true);
  });

  it('UT-TKT-03: Another client cannot access foreign ticket', () => {
    expect(canAccessTicket(ticket, { id: 'unrelated_client_456', role: 'client' })).toBe(false);
  });
});
