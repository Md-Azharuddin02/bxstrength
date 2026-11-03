import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidMobile } from '../../src/utils/phoneValidation';

test('valid international mobiles (with country code) are accepted', () => {
  for (const n of ['+44 7911 123456', '+447911123456', '+91 84235 94482', '+919876543210', '']) {
    assert.equal(isValidMobile(n), true, n);
  }
});

test('numbers without a country code, too short, or malformed are rejected', () => {
  for (const n of ['07911 123456', '98765 43210', '918423594482', '+91 84235 9448', '+44 12345', 'notaphone']) {
    assert.equal(isValidMobile(n), false, n);
  }
});
