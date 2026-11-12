import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAmountForInput, formatMoney, parseAmountToMinorUnits } from '../src/lib/money';

test('parses decimal input into exact minor currency units', () => {
  assert.equal(parseAmountToMinorUnits('12.34', 'USD'), 1234);
  assert.equal(parseAmountToMinorUnits('12', 'USD'), 1200);
  assert.equal(parseAmountToMinorUnits('12', 'JPY'), 12);
});

test('rejects invalid, zero, over-precision, and unsafe amounts', () => {
  assert.equal(parseAmountToMinorUnits('', 'USD'), null);
  assert.equal(parseAmountToMinorUnits('0.00', 'USD'), null);
  assert.equal(parseAmountToMinorUnits('1.001', 'USD'), null);
  assert.equal(parseAmountToMinorUnits('1.1', 'JPY'), null);
  assert.equal(parseAmountToMinorUnits('90071992547409.92', 'USD'), null);
  assert.equal(parseAmountToMinorUnits('1e2', 'USD'), null);
});

test('formats saved minor units consistently for display and editing', () => {
  assert.equal(formatAmountForInput(1234, 'USD'), '12.34');
  assert.equal(formatAmountForInput(12, 'JPY'), '12');
  assert.equal(formatMoney(1234, 'USD', 'en-US'), '$12.34');
});
