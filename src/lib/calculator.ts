export type Operator = '+' | '-' | '*' | '/';

export type CalculatorState = {
  display: string;
  storedValue: number | null;
  operator: Operator | null;
  startsNewEntry: boolean;
  expression: string;
  error: string | null;
};

const initialState: CalculatorState = {
  display: '0',
  storedValue: null,
  operator: null,
  startsNewEntry: false,
  expression: '',
  error: null,
};

const operatorSymbols: Record<Operator, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

function formatResult(value: number): string {
  return String(Number(value.toPrecision(12)));
}

function calculate(left: number, right: number, operator: Operator): number {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
  }
}

function showError(message: string): CalculatorState {
  return {
    ...initialState,
    display: 'Error',
    error: message,
  };
}

function enterDigit(state: CalculatorState, digit: string): CalculatorState {
  if (!state.startsNewEntry && state.display.replace('.', '').length >= 15) {
    return state;
  }

  const display =
    state.startsNewEntry || state.display === '0' ? digit : `${state.display}${digit}`;
  const expression =
    state.operator !== null && state.storedValue !== null
      ? `${formatResult(state.storedValue)} ${operatorSymbols[state.operator]} ${display}`
      : '';

  return {
    ...state,
    display,
    startsNewEntry: false,
    expression,
    error: null,
  };
}

function enterOperator(state: CalculatorState, operator: Operator): CalculatorState {
  if (state.operator !== null && state.storedValue !== null && !state.startsNewEntry) {
    const right = Number(state.display);
    if (state.operator === '/' && right === 0) {
      return showError('Cannot divide by zero.');
    }

    const result = calculate(state.storedValue, right, state.operator);
    if (!Number.isFinite(result)) {
      return showError('That result is too large to display.');
    }

    const display = formatResult(result);
    return {
      ...state,
      display,
      storedValue: result,
      operator,
      startsNewEntry: true,
      expression: `${display} ${operatorSymbols[operator]}`,
    };
  }

  const storedValue = state.operator === null ? Number(state.display) : state.storedValue;
  if (storedValue === null) {
    return state;
  }

  return {
    ...state,
    storedValue,
    operator,
    startsNewEntry: true,
    expression: `${formatResult(storedValue)} ${operatorSymbols[operator]}`,
  };
}

function enterDecimal(state: CalculatorState): CalculatorState {
  if (state.startsNewEntry) {
    const expression =
      state.operator !== null && state.storedValue !== null
        ? `${formatResult(state.storedValue)} ${operatorSymbols[state.operator]} 0.`
        : '';
    return { ...state, display: '0.', startsNewEntry: false, expression, error: null };
  }

  if (state.display.includes('.')) {
    return state;
  }

  const display = `${state.display}.`;
  const expression =
    state.operator !== null && state.storedValue !== null
      ? `${formatResult(state.storedValue)} ${operatorSymbols[state.operator]} ${display}`
      : '';
  return { ...state, display, expression };
}

function enterEquals(state: CalculatorState): CalculatorState {
  if (state.operator === null || state.storedValue === null || state.startsNewEntry) {
    return state;
  }

  const right = Number(state.display);
  if (state.operator === '/' && right === 0) {
    return showError('Cannot divide by zero.');
  }

  const result = calculate(state.storedValue, right, state.operator);
  if (!Number.isFinite(result)) {
    return showError('That result is too large to display.');
  }

  return {
    ...initialState,
    display: formatResult(result),
    startsNewEntry: true,
    expression: `${formatResult(state.storedValue)} ${operatorSymbols[state.operator]} ${formatResult(right)} =`,
  };
}

export function pressCalculatorKey(state: CalculatorState, key: string): CalculatorState {
  if (key === 'AC') {
    return initialState;
  }

  if (state.error !== null) {
    if (/^\d$/.test(key)) {
      return enterDigit(initialState, key);
    }
    return key === '.' ? enterDecimal(initialState) : state;
  }

  if (/^\d$/.test(key)) {
    return enterDigit(state, key);
  }

  if (key === '.') {
    return enterDecimal(state);
  }

  if (key === 'DEL') {
    if (state.startsNewEntry && state.operator !== null) {
      return { ...state, storedValue: null, operator: null, startsNewEntry: false, expression: '' };
    }
    if (state.startsNewEntry) {
      return initialState;
    }
    const display = state.display.length > 1 ? state.display.slice(0, -1) : '0';
    const expression =
      state.operator !== null && state.storedValue !== null
        ? `${formatResult(state.storedValue)} ${operatorSymbols[state.operator]} ${display}`
        : '';
    return { ...state, display, expression };
  }

  if (key === '=') {
    return enterEquals(state);
  }

  if (key === '+' || key === '-' || key === '*' || key === '/') {
    return enterOperator(state, key);
  }

  return state;
}

export function createInitialCalculatorState(): CalculatorState {
  return { ...initialState };
}
