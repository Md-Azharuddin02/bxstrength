import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidUkMobile } from '../../src/utils/phoneValidation';

test('UK mobile numbers in common formats are accepted', () => {
  for (const n of ['07911 123456', '07911123456', '+44 7911 123456', '+447911123456', '0044 7911 123456', '+44 (0)7911 123456', '']) {
    assert.equal(isValidUkMobile(n), true, n);
  }
});

test('Indian and other non-UK numbers are rejected', () => {
  for (const n of ['+91 84235 94482', '918423594482', '98765 43210', '+1 415 555 0100', '020 7946 0958', '07911 12345']) {
    assert.equal(isValidUkMobile(n), false, n);
  }
});
