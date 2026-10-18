import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const RegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

describe('Unit: Backend Schema Validation with Zod', () => {
  it('UT-VAL-01: Validates compliant registration payloads', () => {
    const valid = {
      name: 'James Coach',
      email: 'james@bxstrength.com',
      password: 'StrongPassword123!',
      phone: '+447911123456',
    };

    const parsed = RegistrationSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('UT-VAL-02: Rejects invalid emails and undersized passwords', () => {
    const invalid = {
      name: 'J',
      email: 'not-an-email',
      password: 'short',
    };

    const parsed = RegistrationSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
