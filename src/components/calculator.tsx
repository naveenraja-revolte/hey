'use client';

import { useEffect, useReducer } from 'react';

type Operator = '+' | '−' | '×' | '÷';

type CalculatorState = {
  display: string;
  storedValue: number | null;
  operator: Operator | null;
  replaceDisplay: boolean;
  error: string | null;
};

type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operator'; value: Operator }
  | { type: 'equals' }
  | { type: 'clear' }
  | { type: 'backspace' }
  | { type: 'toggle-sign' };

type CalculationResult = { value: number } | { error: string };

const initialState: CalculatorState = {
  display: '0',
  storedValue: null,
  operator: null,
  replaceDisplay: false,
  error: null,
};

function calculate(
  left: number,
  right: number,
  operator: Operator,
): CalculationResult {
  if (operator === '÷' && right === 0) {
    return { error: 'Cannot divide by zero' };
  }

  const result = {
    '+': () => left + right,
    '−': () => left - right,
    '×': () => left * right,
    '÷': () => left / right,
  }[operator]();

  if (!Number.isFinite(result)) {
    return { error: 'Result is outside the supported range' };
  }

  return { value: Number(result.toPrecision(12)) };
}

function applyResult(
  state: CalculatorState,
  result: CalculationResult,
  nextOperator: Operator | null,
): CalculatorState {
  if ('error' in result) {
    return {
      ...state,
      error: result.error,
      replaceDisplay: true,
    };
  }

  return {
    display: String(result.value),
    storedValue: nextOperator === null ? null : result.value,
    operator: nextOperator,
    replaceDisplay: true,
    error: null,
  };
}

function reducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  if (action.type === 'clear') {
    return initialState;
  }

  if (action.type === 'digit') {
    const startsNewCalculation =
      state.error !== null || (state.replaceDisplay && state.operator === null);
    const startsNewOperand = state.replaceDisplay && state.operator !== null;
    const current =
      startsNewCalculation || startsNewOperand ? '' : state.display;
    const display =
      current === '0'
        ? action.value
        : current === '-0'
          ? `-${action.value}`
          : current + action.value;

    return {
      display,
      storedValue: startsNewCalculation ? null : state.storedValue,
      operator: startsNewCalculation ? null : state.operator,
      replaceDisplay: false,
      error: null,
    };
  }

  if (action.type === 'decimal') {
    if (state.error !== null) {
      return { ...initialState, display: '0.' };
    }

    const startsNewCalculation =
      state.replaceDisplay && state.operator === null;
    const startsNewOperand = state.replaceDisplay && state.operator !== null;
    const current =
      startsNewCalculation || startsNewOperand ? '' : state.display;

    if (current.includes('.')) {
      return state;
    }

    return {
      display: current === '' ? '0.' : `${current}.`,
      storedValue: startsNewCalculation ? null : state.storedValue,
      operator: startsNewCalculation ? null : state.operator,
      replaceDisplay: false,
      error: null,
    };
  }

  if (action.type === 'operator') {
    if (state.error !== null) {
      return state;
    }

    if (
      state.operator !== null &&
      state.storedValue !== null &&
      !state.replaceDisplay
    ) {
      const result = calculate(
        state.storedValue,
        Number(state.display),
        state.operator,
      );
      return applyResult(state, result, action.value);
    }

    return {
      ...state,
      storedValue:
        state.operator === null ? Number(state.display) : state.storedValue,
      operator: action.value,
      replaceDisplay: true,
    };
  }

  if (action.type === 'equals') {
    if (
      state.error !== null ||
      state.operator === null ||
      state.storedValue === null
    ) {
      return state;
    }

    return applyResult(
      state,
      calculate(state.storedValue, Number(state.display), state.operator),
      null,
    );
  }

  if (action.type === 'backspace') {
    if (state.error !== null) {
      return initialState;
    }

    if (state.replaceDisplay) {
      return { ...state, display: '0', replaceDisplay: false };
    }

    const shortened = state.display.slice(0, -1);
    const display = shortened === '' || shortened === '-' ? '0' : shortened;

    return { ...state, display };
  }

  if (action.type === 'toggle-sign') {
    if (state.error !== null) {
      return state;
    }

    const startsNewOperand = state.replaceDisplay && state.operator !== null;
    const current = startsNewOperand ? '0' : state.display;
    const display = current.startsWith('-') ? current.slice(1) : `-${current}`;

    return { ...state, display, replaceDisplay: false };
  }

  return state;
}

const keys = [
  {
    label: 'AC',
    action: { type: 'clear' },
    tone: 'utility',
    name: 'Clear calculation',
  },
  {
    label: '⌫',
    action: { type: 'backspace' },
    tone: 'utility',
    name: 'Delete last character',
  },
  {
    label: '±',
    action: { type: 'toggle-sign' },
    tone: 'utility',
    name: 'Change sign',
  },
  {
    label: '÷',
    action: { type: 'operator', value: '÷' },
    tone: 'operator',
    name: 'Divide',
  },
  {
    label: '7',
    action: { type: 'digit', value: '7' },
    tone: 'number',
    name: '7',
  },
  {
    label: '8',
    action: { type: 'digit', value: '8' },
    tone: 'number',
    name: '8',
  },
  {
    label: '9',
    action: { type: 'digit', value: '9' },
    tone: 'number',
    name: '9',
  },
  {
    label: '×',
    action: { type: 'operator', value: '×' },
    tone: 'operator',
    name: 'Multiply',
  },
  {
    label: '4',
    action: { type: 'digit', value: '4' },
    tone: 'number',
    name: '4',
  },
  {
    label: '5',
    action: { type: 'digit', value: '5' },
    tone: 'number',
    name: '5',
  },
  {
    label: '6',
    action: { type: 'digit', value: '6' },
    tone: 'number',
    name: '6',
  },
  {
    label: '−',
    action: { type: 'operator', value: '−' },
    tone: 'operator',
    name: 'Subtract',
  },
  {
    label: '1',
    action: { type: 'digit', value: '1' },
    tone: 'number',
    name: '1',
  },
  {
    label: '2',
    action: { type: 'digit', value: '2' },
    tone: 'number',
    name: '2',
  },
  {
    label: '3',
    action: { type: 'digit', value: '3' },
    tone: 'number',
    name: '3',
  },
  {
    label: '+',
    action: { type: 'operator', value: '+' },
    tone: 'operator',
    name: 'Add',
  },
  {
    label: '0',
    action: { type: 'digit', value: '0' },
    tone: 'number',
    name: '0',
  },
  {
    label: '.',
    action: { type: 'decimal' },
    tone: 'number',
    name: 'Decimal point',
  },
  {
    label: '=',
    action: { type: 'equals' },
    tone: 'equals',
    name: 'Calculate result',
  },
] as const;

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const expression =
    state.operator !== null && state.storedValue !== null
      ? `${state.storedValue} ${state.operator}`
      : 'READY';

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest('button') &&
        event.key === 'Enter'
      ) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        dispatch({ type: 'digit', value: event.key });
      } else if (event.key === '.') {
        dispatch({ type: 'decimal' });
      } else if (event.key === '+') {
        dispatch({ type: 'operator', value: '+' });
      } else if (event.key === '-') {
        dispatch({ type: 'operator', value: '−' });
      } else if (event.key === '*') {
        dispatch({ type: 'operator', value: '×' });
      } else if (event.key === '/') {
        dispatch({ type: 'operator', value: '÷' });
      } else if (event.key === 'Enter' || event.key === '=') {
        dispatch({ type: 'equals' });
      } else if (event.key === 'Backspace') {
        dispatch({ type: 'backspace' });
      } else if (event.key === 'Escape' || event.key === 'Delete') {
        dispatch({ type: 'clear' });
      } else {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section aria-label="Calculator" className="calculator">
      <div className="calculator-display">
        <p className="calculator-expression" aria-hidden="true">
          {expression}
        </p>
        <output
          className="calculator-value"
          aria-label="Current value"
          aria-live="polite"
        >
          {state.display}
        </output>
        <p className="calculator-error" role="status" aria-live="polite">
          {state.error ?? '\u00a0'}
        </p>
      </div>

      <div className="keypad" role="group" aria-label="Calculator keypad">
        {keys.map((key) => (
          <button
            key={key.label}
            type="button"
            className={`key key-${key.tone}`}
            aria-label={key.name}
            onClick={() => dispatch(key.action)}
          >
            {key.label}
          </button>
        ))}
      </div>

      <div className="keyboard-hint">
        <span className="keyboard-dot" aria-hidden="true" />
        <span>Keyboard ready</span>
        <details className="keyboard-guide" id="keyboard-guide">
          <summary>Shortcuts</summary>
          <dl className="shortcut-list">
            <dt>0–9</dt>
            <dd>Enter a digit</dd>
            <dt>.</dt>
            <dd>Decimal point</dd>
            <dt>+ − * /</dt>
            <dd>Choose an operation</dd>
            <dt>Enter or =</dt>
            <dd>Show the result</dd>
            <dt>Backspace</dt>
            <dd>Delete the last character</dd>
            <dt>Escape or Delete</dt>
            <dd>Clear the calculation</dd>
          </dl>
        </details>
      </div>
    </section>
  );
}
