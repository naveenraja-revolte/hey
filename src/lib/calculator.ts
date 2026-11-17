export type CalculatorOperator = '+' | '−' | '×' | '÷';

export type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; value: CalculatorOperator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'sign' }
  | { type: 'percent' };

export interface CalculatorState {
  display: string;
  storedValue: number | null;
  operator: CalculatorOperator | null;
  awaitingOperand: boolean;
  errorMessage: string | null;
}

export const initialCalculatorState: CalculatorState = {
  display: '0',
  storedValue: null,
  operator: null,
  awaitingOperand: false,
  errorMessage: null,
};

const MAX_DIGITS = 12;

function formatNumber(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  return String(Number(value.toPrecision(MAX_DIGITS)));
}

function performOperation(
  left: number,
  right: number,
  operator: CalculatorOperator
): number | null {
  switch (operator) {
    case '+':
      return left + right;
    case '−':
      return left - right;
    case '×':
      return left * right;
    case '÷':
      return right === 0 ? null : left / right;
  }
}

function withResult(state: CalculatorState, value: number): CalculatorState {
  const result = formatNumber(value);
  if (result === null) {
    return { ...state, display: 'Error', errorMessage: 'Result is out of range.' };
  }

  return { ...state, display: result, errorMessage: null };
}

function operationError(
  state: CalculatorState,
  operator: CalculatorOperator,
  right: number
): CalculatorState {
  const errorMessage =
    operator === '÷' && right === 0 ? 'Cannot divide by zero.' : 'Result is out of range.';

  return { ...state, display: 'Error', errorMessage };
}

export function applyCalculatorAction(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  if (action.type === 'clear') return initialCalculatorState;

  if (state.errorMessage !== null) {
    if (action.type === 'digit') {
      return { ...initialCalculatorState, display: action.value };
    }
    if (action.type === 'decimal') {
      return { ...initialCalculatorState, display: '0.' };
    }
    return state;
  }

  if (action.type === 'digit') {
    const display = state.awaitingOperand ? '' : state.display;
    const digitCount = display.replace(/\D/g, '').length;
    if (digitCount >= MAX_DIGITS) return state;
    const nextDisplay = display === '0' ? action.value : `${display}${action.value}`;
    return { ...state, display: nextDisplay, awaitingOperand: false };
  }

  if (action.type === 'decimal') {
    if (state.awaitingOperand) {
      return { ...state, display: '0.', awaitingOperand: false };
    }
    if (state.display.includes('.')) return state;
    return { ...state, display: `${state.display}.` };
  }

  if (action.type === 'operator') {
    const currentValue = Number(state.display);
    if (state.operator && state.storedValue !== null && !state.awaitingOperand) {
      const result = performOperation(state.storedValue, currentValue, state.operator);
      if (result === null) return operationError(state, state.operator, currentValue);
      const resultState = withResult(state, result);
      if (resultState.errorMessage) return resultState;
      return {
        ...resultState,
        storedValue: Number(resultState.display),
        operator: action.value,
        awaitingOperand: true,
      };
    }

    return {
      ...state,
      storedValue: state.storedValue ?? currentValue,
      operator: action.value,
      awaitingOperand: true,
    };
  }

  if (action.type === 'equals') {
    if (state.operator === null || state.storedValue === null || state.awaitingOperand) {
      return state;
    }
    const right = Number(state.display);
    const result = performOperation(state.storedValue, right, state.operator);
    if (result === null) return operationError(state, state.operator, right);
    return {
      ...withResult(state, result),
      storedValue: null,
      operator: null,
      awaitingOperand: true,
    };
  }

  if (action.type === 'backspace') {
    if (state.awaitingOperand) return state;
    const display = state.display.slice(0, -1);
    const nextDisplay = display === '' || display === '-' ? '0' : display;
    return { ...state, display: nextDisplay };
  }

  if (action.type === 'sign') {
    const value = Number(state.display);
    if (value === 0) return state;
    return {
      ...state,
      display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`,
    };
  }

  const percentage = formatNumber(Number(state.display) / 100);
  if (percentage === null) {
    return { ...state, display: 'Error', errorMessage: 'Result is out of range.' };
  }
  return { ...state, display: percentage, awaitingOperand: false };
}

export function actionForKey(key: string): CalculatorAction | null {
  if (/^[0-9]$/.test(key)) return { type: 'digit', value: key };
  if (key === '.') return { type: 'decimal' };
  if (key === '+') return { type: 'operator', value: '+' };
  if (key === '-') return { type: 'operator', value: '−' };
  if (key === '*') return { type: 'operator', value: '×' };
  if (key === '/') return { type: 'operator', value: '÷' };
  if (key === 'Enter' || key === '=') return { type: 'equals' };
  if (key === 'Backspace') return { type: 'backspace' };
  if (key === 'Escape' || key === 'Delete') return { type: 'clear' };
  if (key === '%') return { type: 'percent' };
  return null;
}
