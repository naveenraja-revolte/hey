export type CalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide';

export type CalculatorInput =
  | { type: 'digit'; value: number }
  | { type: 'operator'; value: CalculatorOperator }
  | {
      type: 'action';
      value: 'clear' | 'backspace' | 'decimal' | 'toggle-sign' | 'percent' | 'equals';
    };

export interface CalculatorState {
  display: string;
  previousValue: number | null;
  operator: CalculatorOperator | null;
  waitingForOperand: boolean;
  expression: string;
  error: string | null;
}

const OPERATOR_SYMBOLS: Record<CalculatorOperator, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

const MAX_INPUT_LENGTH = 12;

export function createInitialCalculatorState(): CalculatorState {
  return {
    display: '0',
    previousValue: null,
    operator: null,
    waitingForOperand: false,
    expression: '',
    error: null,
  };
}

export function formatCalculatorNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  if (Object.is(value, -0)) return '0';
  return String(Number(value.toPrecision(12)));
}

function evaluateOperation(
  left: number,
  right: number,
  operator: CalculatorOperator
): number | null {
  switch (operator) {
    case 'add':
      return left + right;
    case 'subtract':
      return left - right;
    case 'multiply':
      return left * right;
    case 'divide':
      return right === 0 ? null : left / right;
  }
}

function resultState(
  state: CalculatorState,
  left: number,
  right: number,
  operator: CalculatorOperator
): CalculatorState {
  const result = evaluateOperation(left, right, operator);
  const expression = `${formatCalculatorNumber(left)} ${OPERATOR_SYMBOLS[operator]} ${formatCalculatorNumber(right)} =`;

  if (result === null) {
    return {
      ...createInitialCalculatorState(),
      expression,
      error: 'Cannot divide by zero',
    };
  }

  if (!Number.isFinite(result)) {
    return {
      ...createInitialCalculatorState(),
      expression,
      error: 'Result is outside the supported range',
    };
  }

  return {
    display: formatCalculatorNumber(result),
    previousValue: null,
    operator: null,
    waitingForOperand: true,
    expression,
    error: null,
  };
}

function applyOperator(state: CalculatorState, nextOperator: CalculatorOperator): CalculatorState {
  if (state.error) return state;

  const currentValue = Number(state.display);
  if (state.operator && state.previousValue !== null) {
    if (state.waitingForOperand) {
      return {
        ...state,
        operator: nextOperator,
        expression: `${formatCalculatorNumber(state.previousValue)} ${OPERATOR_SYMBOLS[nextOperator]}`,
      };
    }

    const result = evaluateOperation(state.previousValue, currentValue, state.operator);
    if (result === null || !Number.isFinite(result)) {
      return resultState(state, state.previousValue, currentValue, state.operator);
    }

    return {
      ...state,
      display: formatCalculatorNumber(result),
      previousValue: result,
      operator: nextOperator,
      waitingForOperand: true,
      expression: `${formatCalculatorNumber(result)} ${OPERATOR_SYMBOLS[nextOperator]}`,
    };
  }

  return {
    ...state,
    previousValue: currentValue,
    operator: nextOperator,
    waitingForOperand: true,
    expression: `${formatCalculatorNumber(currentValue)} ${OPERATOR_SYMBOLS[nextOperator]}`,
  };
}

export function applyCalculatorInput(
  currentState: CalculatorState,
  input: CalculatorInput
): CalculatorState {
  if (input.type === 'action' && input.value === 'clear') {
    return createInitialCalculatorState();
  }

  const state = currentState.error ? createInitialCalculatorState() : currentState;

  if (input.type === 'digit') {
    const nextDisplay = state.waitingForOperand
      ? String(input.value)
      : state.display === '0'
        ? String(input.value)
        : state.display;

    if (!state.waitingForOperand && state.display !== '0') {
      const digits = state.display.replace(/[-.]/g, '');
      if (digits.length >= MAX_INPUT_LENGTH) return state;
    }

    return {
      ...state,
      display: nextDisplay,
      waitingForOperand: false,
      expression: state.operator ? state.expression : '',
      error: null,
    };
  }

  if (input.type === 'operator') return applyOperator(state, input.value);

  switch (input.value) {
    case 'decimal':
      if (state.waitingForOperand) {
        return { ...state, display: '0.', waitingForOperand: false };
      }
      if (state.display.includes('.')) return state;
      return { ...state, display: `${state.display}.` };
    case 'backspace': {
      if (state.waitingForOperand) return state;
      const shortenedDisplay = state.display.slice(0, -1);
      const display = shortenedDisplay === '' || shortenedDisplay === '-' ? '0' : shortenedDisplay;
      return { ...state, display };
    }
    case 'toggle-sign': {
      if (state.waitingForOperand) {
        return { ...state, display: '-0', waitingForOperand: false };
      }
      if (Number(state.display) === 0) {
        return { ...state, display: state.display.startsWith('-') ? '0' : '-0' };
      }
      return {
        ...state,
        display: state.display.startsWith('-') ? state.display.slice(1) : `-${state.display}`,
      };
    }
    case 'percent':
      return {
        ...state,
        display: formatCalculatorNumber(Number(state.display) / 100),
        waitingForOperand: false,
      };
    case 'equals': {
      if (state.operator === null || state.previousValue === null) return state;
      const rightValue = state.waitingForOperand ? state.previousValue : Number(state.display);
      return resultState(state, state.previousValue, rightValue, state.operator);
    }
    case 'clear':
      return createInitialCalculatorState();
  }
}
