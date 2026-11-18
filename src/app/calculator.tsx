'use client';

import { useEffect, useReducer } from 'react';
import { applyCalculatorInput, createInitialCalculatorState } from '@/lib/calculator';
import type { CalculatorInput } from '@/lib/calculator';
import { CalculatorDisplay } from './calculator-display';
import { CalculatorKeypad } from './calculator-keypad';

function getKeyboardInput(key: string): CalculatorInput | null {
  if (/^\d$/.test(key)) return { type: 'digit', value: Number(key) };

  switch (key) {
    case '+':
      return { type: 'operator', value: 'add' };
    case '-':
      return { type: 'operator', value: 'subtract' };
    case '*':
    case 'x':
    case 'X':
      return { type: 'operator', value: 'multiply' };
    case '/':
      return { type: 'operator', value: 'divide' };
    case '.':
    case ',':
      return { type: 'action', value: 'decimal' };
    case '%':
      return { type: 'action', value: 'percent' };
    case 'Enter':
    case '=':
      return { type: 'action', value: 'equals' };
    case 'Backspace':
      return { type: 'action', value: 'backspace' };
    case 'Escape':
    case 'Delete':
      return { type: 'action', value: 'clear' };
    default:
      return null;
  }
}

export function Calculator() {
  const [state, dispatch] = useReducer(applyCalculatorInput, createInitialCalculatorState());

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement) {
        const tagName = event.target.tagName;
        if (
          event.target.isContentEditable ||
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT'
        ) {
          return;
        }
        if (tagName === 'BUTTON' && (event.key === 'Enter' || event.key === ' ')) {
          return;
        }
      }

      const input = getKeyboardInput(event.key);
      if (!input) return;
      event.preventDefault();
      dispatch(input);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <section
        className="calculator-enter rounded-container border-border bg-card w-full max-w-sm border p-5 shadow-sm sm:p-6"
        aria-label="Calculator"
      >
        <header className="mb-5">
          <h1 className="font-heading text-card-foreground text-2xl leading-8 font-semibold tracking-tight">
            Calculator
          </h1>
          <p className="text-muted-foreground text-base leading-6">
            Use your keyboard or tap a key
          </p>
        </header>
        <CalculatorDisplay
          display={state.display}
          expression={state.expression}
          error={state.error}
        />
        <CalculatorKeypad activeOperator={state.operator} onInput={dispatch} />
      </section>
    </main>
  );
}
