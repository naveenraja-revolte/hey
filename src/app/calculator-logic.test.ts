import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateExpression, CalculatorInputError, formatResult } from './calculator-logic';

test('applies multiplication and division before addition and subtraction', () => {
  assert.equal(calculateExpression('2 + 3 * 4'), 14);
  assert.equal(calculateExpression('18 / 3 - 2'), 4);
});

test('respects parentheses and unary signs', () => {
  assert.equal(calculateExpression('(2 + 3) * 4'), 20);
  assert.equal(calculateExpression('-.5 * (8 + 2)'), -5);
  assert.equal(calculateExpression('-(3 + 2)'), -5);
});

test('handles decimal arithmetic and scientific notation from a prior result', () => {
  assert.equal(calculateExpression('0.1 + 0.2'), 0.30000000000000004);
  assert.equal(calculateExpression('1e+21 / 10'), 1e20);
});

test('rejects division by zero with a recovery message', () => {
  assert.throws(
    () => calculateExpression('9 / (3 - 3)'),
    (error: unknown) =>
      error instanceof CalculatorInputError && error.message.includes('Cannot divide by zero')
  );
});

test('rejects incomplete, malformed, and unsupported expressions', () => {
  assert.throws(() => calculateExpression('4 +'));
  assert.throws(() => calculateExpression('(2 + 3'));
  assert.throws(() => calculateExpression('2 @ 3'));
  assert.throws(() => calculateExpression('1e309'));
});

test('rejects expressions beyond the input limit and formats results cleanly', () => {
  assert.throws(() => calculateExpression('1'.repeat(161)));
  assert.equal(formatResult(1234.5), '1,234.5');
  assert.equal(formatResult(-0), '0');
});
