import { describe, it, expect } from 'vitest';

export interface CoachingAssignment {
  clientId: string;
  coachId: string;
  assignedBy: string;
  status: 'pending' | 'active' | 'transferred' | 'terminated';
}

export function assignClientToCoach(clientId: string, coachId: string, assignedByRole: string): CoachingAssignment {
  if (assignedByRole !== 'admin' && assignedByRole !== 'headcoach') {
    throw new Error('Unauthorized: Only Admin or Head Coach can assign athletes to coaches');
  }

  return {
    clientId,
    coachId,
    assignedBy: assignedByRole,
    status: 'active',
  };
}

describe('Unit: Backend Coaching Assignment Business Logic', () => {
  it('UT-COACH-01: Head Coach and Admin can assign clients to coaches', () => {
    const assignByHC = assignClientToCoach('client_1', 'coach_1', 'headcoach');
    expect(assignByHC.status).toBe('active');
    expect(assignByHC.coachId).toBe('coach_1');

    const assignByAdmin = assignClientToCoach('client_2', 'coach_2', 'admin');
    expect(assignByAdmin.status).toBe('active');
  });

  it('UT-COACH-02: Self-assignment by coach or client is rejected', () => {
    expect(() => assignClientToCoach('client_1', 'coach_1', 'coach')).toThrow(/Unauthorized/);
    expect(() => assignClientToCoach('client_1', 'coach_1', 'client')).toThrow(/Unauthorized/);
  });
});
