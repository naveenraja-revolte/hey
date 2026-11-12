'use client';

import { useReducer } from 'react';

type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

type CalculatorState = {
  display: string;
  accumulator: number | null;
  operation: Operation | null;
  waitingForOperand: boolean;
  error: string | null;
};

type CalculatorAction =
  | { type: 'digit'; value: string }
  | { type: 'decimal' }
  | { type: 'operation'; value: Operation }
  | { type: 'equals' }
  | { type: 'clear' };

const initialState: CalculatorState = {
  display: '0',
  accumulator: null,
  operation: null,
  waitingForOperand: false,
  error: null,
};

const operationLabels: Record<Operation, string> = {
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply',
  divide: 'Divide',
};

const operationSymbols: Record<Operation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

function formatResult(value: number): string {
  const rounded = Number.parseFloat(value.toPrecision(12));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function evaluate(
  left: number,
  right: number,
  operation: Operation
): { value: number; error: null } | { value: null; error: string } {
  if (operation === 'divide' && right === 0) {
    return { value: null, error: 'Division by zero. Press Clear to start again.' };
  }

  const value = {
    add: () => left + right,
    subtract: () => left - right,
    multiply: () => left * right,
    divide: () => left / right,
  }[operation]();

  if (!Number.isFinite(value)) {
    return { value: null, error: 'That result is too large. Press Clear to start again.' };
  }

  return { value, error: null };
}

function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  if (action.type === 'clear') {
    return initialState;
  }

  if (state.error) {
    return state;
  }

  if (action.type === 'digit') {
    const display = state.waitingForOperand
      ? action.value
      : state.display === '0'
        ? action.value
        : state.display + action.value;

    return {
      ...state,
      display,
      waitingForOperand: false,
    };
  }

  if (action.type === 'decimal') {
    if (state.waitingForOperand) {
      return {
        ...state,
        display: '0.',
        waitingForOperand: false,
      };
    }

    if (state.display.includes('.')) {
      return state;
    }

    return { ...state, display: `${state.display}.` };
  }

  if (action.type === 'operation') {
    const currentValue = Number(state.display);

    if (state.operation && state.accumulator !== null && !state.waitingForOperand) {
      const result = evaluate(state.accumulator, currentValue, state.operation);

      if (result.value === null) {
        return { ...state, display: 'Error', error: result.error };
      }

      return {
        display: formatResult(result.value),
        accumulator: result.value,
        operation: action.value,
        waitingForOperand: true,
        error: null,
      };
    }

    return {
      ...state,
      accumulator: state.operation ? state.accumulator : currentValue,
      operation: action.value,
      waitingForOperand: true,
    };
  }

  if (!state.operation || state.accumulator === null) {
    return state;
  }

  const result = evaluate(state.accumulator, Number(state.display), state.operation);

  if (result.value === null) {
    return { ...state, display: 'Error', error: result.error };
  }

  return {
    display: formatResult(result.value),
    accumulator: result.value,
    operation: null,
    waitingForOperand: true,
    error: null,
  };
}

const keys: Array<
  | { label: string; type: 'digit'; value: string }
  | { label: string; type: 'decimal' }
  | { label: string; type: 'clear' }
  | { label: string; type: 'operation'; value: Operation }
> = [
  { label: '7', type: 'digit', value: '7' },
  { label: '8', type: 'digit', value: '8' },
  { label: '9', type: 'digit', value: '9' },
  { label: '÷', type: 'operation', value: 'divide' },
  { label: '4', type: 'digit', value: '4' },
  { label: '5', type: 'digit', value: '5' },
  { label: '6', type: 'digit', value: '6' },
  { label: '×', type: 'operation', value: 'multiply' },
  { label: '1', type: 'digit', value: '1' },
  { label: '2', type: 'digit', value: '2' },
  { label: '3', type: 'digit', value: '3' },
  { label: '−', type: 'operation', value: 'subtract' },
  { label: 'Clear', type: 'clear' },
  { label: '0', type: 'digit', value: '0' },
  { label: '.', type: 'decimal' },
  { label: '+', type: 'operation', value: 'add' },
];

export default function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  return (
    <main className="page-shell">
      <div className="page-content">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">
            <span className="brand-mark" aria-hidden="true">
              +
            </span>
            <span>The pocket ledger</span>
          </p>
          <h1 id="page-title">A little clarity in the numbers.</h1>
          <p className="intro-copy">
            A calm place for everyday math. Add, subtract, multiply, or divide—then get straight to
            the answer.
          </p>
          <div className="intro-note">
            <span className="intro-rule" aria-hidden="true" />
            <p>Four operations. One clear answer.</p>
          </div>
        </section>

        <section className="calculator-card" aria-label="Calculator">
          <div className="calculator-heading">
            <span className="calculator-name">
              POCKET LEDGER <span>·</span> 01
            </span>
            <span className={`calculator-status${state.error ? 'is-error' : ''}`}>
              <span className="status-dot" aria-hidden="true" />
              {state.error ? 'CHECK INPUT' : state.operation ? 'READY' : 'STANDING BY'}
            </span>
          </div>

          <div className={`display-panel${state.error ? 'has-error' : ''}`}>
            <div className="display-caption">
              <span>{state.operation ? operationLabels[state.operation] : 'Your result'}</span>
              {state.operation && (
                <span className="pending-symbol">{operationSymbols[state.operation]}</span>
              )}
            </div>
            <output className="display-value" aria-live="polite" aria-atomic="true">
              {state.display}
            </output>
            {state.error && <p className="error-message">{state.error}</p>}
          </div>

          <div className="keypad" role="group" aria-label="Calculator keys">
            {keys.map((key) => {
              const isDisabled = Boolean(state.error) && key.type !== 'clear';
              const isActive = key.type === 'operation' && state.operation === key.value;
              const className = [
                'key',
                key.type === 'operation' ? 'key-operation' : '',
                key.type === 'clear' ? 'key-clear' : '',
                isActive ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${key.type}-${key.label}`}
                  type="button"
                  className={className}
                  disabled={isDisabled}
                  aria-label={key.type === 'operation' ? operationLabels[key.value] : key.label}
                  aria-pressed={key.type === 'operation' ? isActive : undefined}
                  onClick={() => {
                    if (key.type === 'digit') {
                      dispatch({ type: 'digit', value: key.value });
                    } else if (key.type === 'decimal') {
                      dispatch({ type: 'decimal' });
                    } else if (key.type === 'operation') {
                      dispatch({ type: 'operation', value: key.value });
                    } else {
                      dispatch({ type: 'clear' });
                    }
                  }}
                >
                  {key.label}
                </button>
              );
            })}
            <button
              type="button"
              className="key key-equals"
              disabled={Boolean(state.error)}
              aria-label="Equals"
              onClick={() => dispatch({ type: 'equals' })}
            >
              =
            </button>
          </div>
          <p className="calculator-hint">
            Choose an operation, enter the next number, then press =.
          </p>
        </section>
      </div>
      <footer className="page-footer">
        <span>Made for the everyday sums.</span>
        <span aria-hidden="true">01 / 04</span>
      </footer>
    </main>
  );
}
