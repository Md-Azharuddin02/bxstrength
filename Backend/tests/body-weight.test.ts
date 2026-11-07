import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cmFromFeetInches,
  cmFromInches,
  feetInchesFromCm,
  formatWeight,
  inchesFromCm,
  kgFromStoneLbs,
  stoneLbsFromKg,
} from '../../src/utils/bodyWeight.ts';

test('weight shows placeholders until a real value is logged', () => {
  assert.equal(formatWeight(undefined, 'kg'), '-- kg');
  assert.equal(formatWeight(0, 'kg'), '-- kg');
  assert.equal(formatWeight(undefined, 'st'), '-- st -- lbs');
});

test('weight converts to stone and pounds', () => {
  assert.equal(formatWeight(82.5, 'kg'), '82.5 kg');
  assert.equal(formatWeight(75, 'st'), '11 st 11 lbs');
});

test('pounds roll over into the next stone instead of showing 14 lbs', () => {
  assert.equal(formatWeight(63.4, 'st'), '10 st 0 lbs');
});

test('imperial form values convert to the metric values we store', () => {
  assert.equal(kgFromStoneLbs(11, 11), 74.8);
  assert.equal(kgFromStoneLbs(12, 0), 76.2);
  assert.equal(cmFromFeetInches(5, 10), 177.8);
  assert.equal(cmFromInches(32), 81.3);
});

test('switching units keeps the same measurement', () => {
  assert.deepEqual(stoneLbsFromKg(80), { st: 12, lbs: 8.4 });
  assert.equal(kgFromStoneLbs(12, 8.4), 80);
  assert.deepEqual(feetInchesFromCm(177.8), { ft: 5, inches: 10 });
  assert.equal(inchesFromCm(81.3), 32);
});
