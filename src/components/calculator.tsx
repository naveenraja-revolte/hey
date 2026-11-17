'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalculatorKeypad } from '@/components/calculator-keypad';
import {
  actionForKey,
  applyCalculatorAction,
  initialCalculatorState,
  type CalculatorAction,
  type CalculatorOperator,
} from '@/lib/calculator';

function expressionLabel(operator: CalculatorOperator | null, storedValue: number | null) {
  if (operator === null || storedValue === null) return 'Ready';
  return `${storedValue} ${operator}`;
}

export function Calculator() {
  const [state, setState] = useState(initialCalculatorState);
  const handleAction = useCallback((action: CalculatorAction) => {
    setState((currentState) => applyCalculatorAction(currentState, action));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const action = actionForKey(event.key);
      if (action === null) return;
      event.preventDefault();
      handleAction(action);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className="animate-calculator-enter rounded-container border-border bg-card w-full max-w-sm border p-5 shadow-sm sm:p-6"
        aria-label="Calculator"
      >
        <header className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-foreground text-xl font-semibold tracking-tight">
            Calculator
          </h1>
          <p className="text-muted-foreground text-base">Keyboard ready</p>
        </header>

        <div className="rounded-control bg-muted mb-5 px-4 py-4 text-right">
          <p className="text-muted-foreground mb-2 min-h-5 truncate text-base" aria-live="polite">
            {state.errorMessage ?? expressionLabel(state.operator, state.storedValue)}
          </p>
          <output
            className={`block overflow-x-auto font-mono text-4xl leading-tight font-medium tracking-tight sm:text-5xl ${state.errorMessage ? 'text-destructive' : 'text-foreground'}`}
            aria-label="Display"
            aria-live="polite"
          >
            {state.display}
          </output>
        </div>

        <CalculatorKeypad state={state} onAction={handleAction} />

        <p className="text-muted-foreground mt-4 text-center text-base">
          Use 0–9, +, −, ×, ÷, Enter, and Backspace
        </p>
      </section>
    </main>
  );
}
