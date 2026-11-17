'use client';

import { CalculatorKeypad, type CalculatorAction } from '@/components/calculator-keypad';
import { useCalculator } from '@/hooks/use-calculator';
import type { Operator } from '@/lib/calculator';

export function Calculator() {
  const calculator = useCalculator();

  function activateKey(action: CalculatorAction, value: string) {
    switch (action) {
      case 'clear':
        calculator.clear();
        break;
      case 'backspace':
        calculator.backspace();
        break;
      case 'sign':
        calculator.toggleSign();
        break;
      case 'percent':
        calculator.applyPercent();
        break;
      case 'operator':
        calculator.chooseOperator(value as Operator);
        break;
      case 'digit':
        calculator.enterDigit(value);
        break;
      case 'decimal':
        calculator.enterDecimal();
        break;
      case 'equals':
        calculator.equals();
        break;
    }
  }

  return (
    <section
      aria-labelledby="calculator-heading"
      className="border-border bg-card w-full max-w-sm rounded-[var(--radius-container)] border p-6 shadow-sm motion-safe:animate-[calculator-enter_220ms_ease-out_both]"
    >
      <h1
        id="calculator-heading"
        className="text-card-foreground mb-5 text-2xl font-semibold tracking-tight text-balance"
      >
        Calculator
      </h1>

      <div
        role="group"
        aria-label="Calculator display"
        className="bg-muted mb-5 flex min-h-28 flex-col items-end justify-center overflow-hidden rounded-lg px-4 py-3"
      >
        <p className="text-muted-foreground h-6 w-full truncate text-right text-sm">
          {calculator.expression || '\u00a0'}
        </p>
        <output
          aria-live="polite"
          className={`text-foreground w-full truncate text-right font-semibold tabular-nums ${calculator.error ? 'text-2xl' : 'text-4xl'}`}
        >
          {calculator.display}
        </output>
        <p aria-live="polite" className="text-destructive h-5 text-right text-sm">
          {calculator.error || '\u00a0'}
        </p>
      </div>

      <CalculatorKeypad onAction={activateKey} />
    </section>
  );
}
