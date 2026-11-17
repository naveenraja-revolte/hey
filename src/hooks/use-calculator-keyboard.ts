'use client';

import { useEffect } from 'react';
import type { Operator } from '@/lib/calculator';

export function useCalculatorKeyboard(
  enterDigit: (digit: string) => void,
  enterDecimal: () => void,
  chooseOperator: (operator: Operator) => void,
  equals: () => void,
  backspace: () => void,
  clear: () => void,
  applyPercent: () => void
) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        enterDigit(event.key);
      } else if (event.key === '.') {
        event.preventDefault();
        enterDecimal();
      } else if (event.key === '+' || event.key === '-') {
        event.preventDefault();
        chooseOperator(event.key === '+' ? '+' : '−');
      } else if (event.key === '*' || event.key === '/') {
        event.preventDefault();
        chooseOperator(event.key === '*' ? '×' : '÷');
      } else if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        equals();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        backspace();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        clear();
      } else if (event.key === '%') {
        event.preventDefault();
        applyPercent();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applyPercent, backspace, chooseOperator, clear, enterDecimal, enterDigit, equals]);
}
