'use client';

import { useEffect, useReducer } from 'react';
import { CalculatorKeypad } from '@/components/calculator-keypad';
import { calculatorReducer, initialCalculatorState, type CalculatorAction } from '@/lib/calculator';

const keyActions: Record<string, CalculatorAction> = {
  '.': { type: 'decimal' },
  '+': { type: 'operator', value: '+' },
  '-': { type: 'operator', value: '−' },
  '−': { type: 'operator', value: '−' },
  '*': { type: 'operator', value: '×' },
  '×': { type: 'operator', value: '×' },
  '/': { type: 'operator', value: '÷' },
  '÷': { type: 'operator', value: '÷' },
  Enter: { type: 'equals' },
  '=': { type: 'equals' },
  Backspace: { type: 'backspace' },
  Escape: { type: 'clear' },
};

export function Calculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      if (/^[0-9]$/.test(event.key)) {
        dispatch({ type: 'digit', value: event.key });
        return;
      }

      const action = keyActions[event.key];
      if (action) {
        event.preventDefault();
        dispatch(action);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="bg-background text-foreground grid min-h-dvh place-items-center px-4 py-8 sm:px-6">
      <section className="animate-enter w-full max-w-sm" aria-labelledby="calculator-title">
        <h1
          id="calculator-title"
          className="font-heading mb-6 text-3xl font-semibold tracking-tight text-balance"
        >
          Calculator
        </h1>

        <div className="rounded-container border-border bg-card border p-4 shadow-sm sm:p-5">
          <div className="rounded-control bg-muted mb-4 px-4 py-3 text-right">
            <p className="text-muted-foreground min-h-6 overflow-x-auto text-base whitespace-nowrap">
              {state.expression || '\u00a0'}
            </p>
            <p
              role="status"
              aria-live="polite"
              aria-label={`Calculator display: ${state.currentValue}`}
              className="overflow-x-auto font-mono text-4xl font-medium tracking-tight whitespace-nowrap tabular-nums"
            >
              {state.currentValue}
            </p>
            {state.error && <p className="text-destructive mt-2 text-base">{state.error}</p>}
          </div>

          <CalculatorKeypad
            activeOperator={state.operator}
            awaitingNewValue={state.awaitingNewValue}
            onAction={dispatch}
          />

          <p className="text-muted-foreground mt-4 text-center text-base">
            Keyboard: 0–9, + − × ÷, Enter, Backspace, Esc
          </p>
        </div>
      </section>
    </main>
  );
}
