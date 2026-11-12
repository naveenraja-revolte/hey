import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getDefaultExpenseDate,
  getMonthBounds,
  getMonthLabel,
  isValidExpenseDate,
  isValidMonthId,
  shiftMonth,
} from '../src/lib/expense-data';
import { currencyFromLocale } from '../src/lib/money';
import { validateExpenseFields } from '../src/lib/expense-validation';
import { getMonthParam } from '../src/lib/month-query';

test('validates real calendar dates and month identifiers', () => {
  assert.equal(isValidExpenseDate('2026-02-28'), true);
  assert.equal(isValidExpenseDate('2026-02-29'), false);
  assert.equal(isValidExpenseDate('2026-13-01'), false);
  assert.equal(isValidMonthId('2026-11'), true);
  assert.equal(isValidMonthId('2026-13'), false);
});

test('calculates month boundaries and adjacent months', () => {
  assert.deepEqual(getMonthBounds('2024-02'), {
    start: '2024-02-01',
    end: '2024-02-29',
  });
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(getMonthLabel('2026-11', 'en-US'), 'November 2026');
  assert.equal(getDefaultExpenseDate('2026-02', new Date(2026, 2, 31)), '2026-02-28');
  assert.equal(getMonthParam('2026-12', '2026-11'), '2026-11');
});

test('chooses a supported currency from the request locale', () => {
  assert.equal(currencyFromLocale('en-GB,en;q=0.9'), 'GBP');
  assert.equal(currencyFromLocale('fr-FR,fr;q=0.9'), 'EUR');
  assert.equal(currencyFromLocale('zh-CN,zh;q=0.9'), 'CNY');
  assert.equal(currencyFromLocale('unknown'), 'USD');
  assert.equal(currencyFromLocale(null), 'USD');
});

test('rejects invalid expense details at the server validation boundary', () => {
  const validFields = {
    amount: '12.34',
    category: 'Groceries',
    occurredOn: '2026-02-28',
    description: '',
    month: '2026-02',
  };

  const validResult = validateExpenseFields(validFields, 'USD');
  assert.equal(validResult.success, true);

  assert.equal(validateExpenseFields({ ...validFields, amount: '' }, 'USD').success, false);
  assert.equal(validateExpenseFields({ ...validFields, amount: '1.001' }, 'USD').success, false);
  assert.equal(
    validateExpenseFields({ ...validFields, occurredOn: '2026-02-29' }, 'USD').success,
    false
  );
  assert.equal(
    validateExpenseFields({ ...validFields, category: 'Unlisted' }, 'USD').success,
    false
  );
});
