export type Operator = '+' | '−' | '×' | '÷';

export type CalculationResult = { ok: true; value: number } | { ok: false; message: string };

export function calculate(left: number, right: number, operator: Operator): CalculationResult {
  if (operator === '÷' && right === 0) {
    return { ok: false, message: 'Cannot divide by zero' };
  }

  const value = {
    '+': () => left + right,
    '−': () => left - right,
    '×': () => left * right,
    '÷': () => left / right,
  }[operator]();

  if (!Number.isFinite(value)) {
    return { ok: false, message: 'Result is too large' };
  }

  return { ok: true, value };
}

export function formatResult(value: number): string {
  const roundedValue = Number(value.toPrecision(12));
  return Object.is(roundedValue, -0) ? '0' : String(roundedValue);
}
