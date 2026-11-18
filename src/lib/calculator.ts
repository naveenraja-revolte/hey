export type Operator = '+' | '−' | '×' | '÷';

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; value: Operator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' };

export type CalculatorState = {
  currentValue: string;
  storedValue: number | null;
  operator: Operator | null;
  expression: string;
  awaitingNewValue: boolean;
  error: string | null;
};

export const initialCalculatorState: CalculatorState = {
  currentValue: '0',
  storedValue: null,
  operator: null,
  expression: '',
  awaitingNewValue: false,
  error: null,
};

function formatNumber(value: number): string {
  return String(Number(value.toPrecision(12)));
}

function calculate(left: number, right: number, operator: Operator): number | null {
  const result = {
    '+': () => left + right,
    '−': () => left - right,
    '×': () => left * right,
    '÷': () => (right === 0 ? null : left / right),
  }[operator]();

  return result !== null && Number.isFinite(result) ? result : null;
}

function operationError(operator: Operator, right: number): string {
  return operator === '÷' && right === 0 ? 'Cannot divide by zero' : 'Result is out of range';
}

function applyCalculation(
  state: CalculatorState,
  left: number,
  right: number,
  operator: Operator
): CalculatorState {
  const result = calculate(left, right, operator);
  const expression = `${formatNumber(left)} ${operator} ${formatNumber(right)} =`;

  if (result === null) {
    const error = operationError(operator, right);
    return { ...state, currentValue: 'Error', expression, error };
  }

  return {
    currentValue: formatNumber(result),
    storedValue: null,
    operator: null,
    expression,
    awaitingNewValue: true,
    error: null,
  };
}

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  if (action.type === 'clear') return initialCalculatorState;

  if (state.error) {
    if (action.type === 'digit') {
      return { ...initialCalculatorState, currentValue: action.value };
    }

    if (action.type === 'decimal') {
      return { ...initialCalculatorState, currentValue: '0.' };
    }

    return initialCalculatorState;
  }

  if (action.type === 'digit') {
    const startsFresh = state.awaitingNewValue;
    const startsNewCalculation = startsFresh && state.operator === null;
    const currentValue = startsFresh ? '0' : state.currentValue;
    const nextValue = currentValue === '0' ? action.value : `${currentValue}${action.value}`;

    return {
      ...state,
      currentValue: nextValue,
      expression: startsNewCalculation ? '' : state.expression,
      storedValue: startsNewCalculation ? null : state.storedValue,
      operator: startsNewCalculation ? null : state.operator,
      awaitingNewValue: false,
    };
  }

  if (action.type === 'decimal') {
    const startsFresh = state.awaitingNewValue;
    const startsNewCalculation = startsFresh && state.operator === null;
    const currentValue = startsFresh ? '0' : state.currentValue;

    return {
      ...state,
      currentValue: currentValue.includes('.') ? currentValue : `${currentValue}.`,
      expression: startsNewCalculation ? '' : state.expression,
      storedValue: startsNewCalculation ? null : state.storedValue,
      operator: startsNewCalculation ? null : state.operator,
      awaitingNewValue: false,
    };
  }

  if (action.type === 'operator') {
    if (state.storedValue !== null && state.operator && !state.awaitingNewValue) {
      const result = calculate(state.storedValue, Number(state.currentValue), state.operator);

      if (result === null) {
        const error = operationError(state.operator, Number(state.currentValue));
        return { ...state, currentValue: 'Error', error };
      }

      const expression = `${formatNumber(result)} ${action.value}`;
      return {
        ...state,
        currentValue: formatNumber(result),
        storedValue: result,
        operator: action.value,
        expression,
        awaitingNewValue: true,
      };
    }

    const currentNumber = Number(state.currentValue);
    return {
      ...state,
      storedValue: currentNumber,
      operator: action.value,
      expression: `${formatNumber(currentNumber)} ${action.value}`,
      awaitingNewValue: true,
    };
  }

  if (action.type === 'equals') {
    if (state.storedValue === null || state.operator === null) return state;

    return applyCalculation(state, state.storedValue, Number(state.currentValue), state.operator);
  }

  if (state.awaitingNewValue && state.operator !== null) return state;

  const shortenedValue = state.currentValue.slice(0, -1);
  return {
    ...state,
    currentValue: shortenedValue === '' || shortenedValue === '-' ? '0' : shortenedValue,
    expression: state.operator === null ? '' : state.expression,
    awaitingNewValue: false,
  };
}
