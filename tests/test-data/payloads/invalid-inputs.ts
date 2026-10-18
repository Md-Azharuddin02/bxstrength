export const invalidRegistrationPayloads = [
  { description: 'empty body', payload: {} },
  { description: 'missing email', payload: { name: 'John Doe', password: 'Password123!' } },
  { description: 'missing password', payload: { name: 'John Doe', email: 'john@example.com' } },
  { description: 'malformed email', payload: { name: 'John Doe', email: 'not-an-email', password: 'Password123!' } },
  { description: 'extremely short password', payload: { name: 'John Doe', email: 'john@example.com', password: '123' } },
  { description: 'oversized name string (10k chars)', payload: { name: 'A'.repeat(10000), email: 'john@example.com', password: 'Password123!' } },
];

export const invalidPaymentPayloads = [
  { description: 'negative amount', payload: { planId: 'starter-protocol', amount: -5000, currency: 'GBP' } },
  { description: 'zero amount', payload: { planId: 'starter-protocol', amount: 0, currency: 'GBP' } },
  { description: 'unsupported currency', payload: { planId: 'starter-protocol', amount: 4900, currency: 'XYZ' } },
  { description: 'non-existent plan ID', payload: { planId: 'hacked_free_pass', amount: 0, currency: 'GBP' } },
];
