import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseMockPayments } from '../../src/services/mockPayment.ts';

test('mock payment is available only when dev mode and the explicit flag are both enabled', () => {
  assert.equal(canUseMockPayments(true, 'true'), true);
  assert.equal(canUseMockPayments(false, 'true'), false);
  assert.equal(canUseMockPayments(true, 'false'), false);
  assert.equal(canUseMockPayments(true, undefined), false);
});
