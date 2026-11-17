'use client';

import { useEffect, useReducer } from 'react';
import { createInitialCalculatorState, pressCalculatorKey } from '@/lib/calculator';
import CalculatorKeypad from './calculator-keypad';

const keyboardKeys: Record<string, string> = {
  Enter: '=',
  '=': '=',
  Backspace: 'DEL',
  Escape: 'AC',
  Delete: 'AC',
  '×': '*',
  '÷': '/',
};

export default function Calculator() {
  const [state, dispatch] = useReducer(pressCalculatorKey, undefined, createInitialCalculatorState);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const key = /^\d$/.test(event.key) ? event.key : (keyboardKeys[event.key] ?? event.key);
      const isCalculatorKey =
        /^\d$/.test(key) || ['.', 'AC', 'DEL', '=', '+', '-', '*', '/'].includes(key);
      if (!isCalculatorKey) {
        return;
      }

      event.preventDefault();
      dispatch(key);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section
        aria-label="Calculator"
        className="w-full max-w-sm animate-[fade-up_240ms_ease-out_both] motion-reduce:animate-none"
      >
        <h1 className="font-heading text-foreground mb-5 text-center text-3xl font-semibold tracking-tight text-balance">
          Calculator
        </h1>

        <div className="border-border border-t-primary bg-card rounded-[var(--radius-container)] border border-t-2 p-5 shadow-sm">
          <div className="bg-muted mb-5 flex min-h-28 flex-col items-end justify-end overflow-hidden rounded-[var(--radius-control)] px-4 py-3 text-right">
            <p
              className="text-muted-foreground min-h-6 w-full truncate text-base"
              aria-hidden="true"
            >
              {state.expression || '\u00a0'}
            </p>
            <output
              aria-label="Calculator display"
              aria-live="polite"
              aria-atomic="true"
              className="text-foreground w-full font-mono text-4xl leading-tight break-all"
            >
              {state.display}
            </output>
          </div>

          {state.error && (
            <p className="text-destructive mb-4 text-base" role="alert">
              {state.error}
            </p>
          )}

          <CalculatorKeypad onPress={dispatch} selectedOperator={state.operator} />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-base">
          Use your keyboard or tap the keys.
        </p>
      </section>
    </main>
  );
}
