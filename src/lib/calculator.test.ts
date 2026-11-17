import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  actionForKey,
  applyCalculatorAction,
  initialCalculatorState,
  type CalculatorAction,
} from './calculator';

function press(...actions: CalculatorAction[]) {
  return actions.reduce(applyCalculatorAction, initialCalculatorState);
}

test('calculates a basic addition', () => {
  const result = press(
    { type: 'digit', value: '2' },
    { type: 'operator', value: '+' },
    { type: 'digit', value: '3' },
    { type: 'equals' }
  );

  assert.equal(result.display, '5');
  assert.equal(result.operator, null);
});

test('evaluates chained operations from left to right', () => {
  const result = press(
    { type: 'digit', value: '8' },
    { type: 'operator', value: '−' },
    { type: 'digit', value: '2' },
    { type: 'operator', value: '×' },
    { type: 'digit', value: '3' },
    { type: 'equals' }
  );

  assert.equal(result.display, '18');
});

test('handles decimals and prevents duplicate decimal points', () => {
  const result = press(
    { type: 'digit', value: '1' },
    { type: 'decimal' },
    { type: 'digit', value: '5' },
    { type: 'decimal' },
    { type: 'digit', value: '2' }
  );

  assert.equal(result.display, '1.52');
});

test('shows a recoverable error for division by zero', () => {
  const failed = press(
    { type: 'digit', value: '8' },
    { type: 'operator', value: '÷' },
    { type: 'digit', value: '0' },
    { type: 'equals' }
  );
  const recovered = applyCalculatorAction(failed, { type: 'digit', value: '4' });

  assert.equal(failed.errorMessage, 'Cannot divide by zero.');
  assert.equal(recovered.display, '4');
  assert.equal(recovered.errorMessage, null);
});

test('applies percent, sign toggle, and backspace', () => {
  const result = press(
    { type: 'digit', value: '2' },
    { type: 'digit', value: '5' },
    { type: 'percent' },
    { type: 'sign' },
    { type: 'backspace' }
  );

  assert.equal(result.display, '-0.2');
});

test('clear restores the initial calculator state', () => {
  const result = press(
    { type: 'digit', value: '9' },
    { type: 'operator', value: '+' },
    { type: 'clear' }
  );

  assert.deepEqual(result, initialCalculatorState);
});

test('maps keyboard controls to calculator actions', () => {
  assert.deepEqual(actionForKey('7'), { type: 'digit', value: '7' });
  assert.deepEqual(actionForKey('/'), { type: 'operator', value: '÷' });
  assert.deepEqual(actionForKey('Enter'), { type: 'equals' });
  assert.deepEqual(actionForKey('Escape'), { type: 'clear' });
  assert.equal(actionForKey('a'), null);
});
