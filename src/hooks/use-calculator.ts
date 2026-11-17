'use client';

import { useCallback, useState } from 'react';
import { useCalculatorKeyboard } from '@/hooks/use-calculator-keyboard';
import { calculate, formatResult, type Operator } from '@/lib/calculator';

export function useCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const clear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setError('');
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const enterDigit = useCallback(
    (digit: string) => {
      setError('');
      setExpression('');
      if (waitingForOperand || display === '0') {
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
      }
      if (display.replace('-', '').replace('.', '').length >= 12) return;
      setDisplay(`${display}${digit}`);
    },
    [display, waitingForOperand]
  );

  const enterDecimal = useCallback(() => {
    setError('');
    setExpression('');
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(`${display}.`);
  }, [display, waitingForOperand]);

  const chooseOperator = useCallback(
    (nextOperator: Operator) => {
      if (error) return;
      const currentValue = Number(display);

      if (storedValue !== null && operator && !waitingForOperand) {
        const result = calculate(storedValue, currentValue, operator);
        if (!result.ok) {
          setDisplay('Error');
          setError(result.message);
          setExpression(`${formatResult(storedValue)} ${operator} ${display}`);
          setStoredValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          return;
        }
        setDisplay(formatResult(result.value));
        setStoredValue(result.value);
        setOperator(nextOperator);
        setExpression(`${formatResult(result.value)} ${nextOperator}`);
        setWaitingForOperand(true);
        return;
      }

      setStoredValue(currentValue);
      setOperator(nextOperator);
      setExpression(`${display} ${nextOperator}`);
      setWaitingForOperand(true);
    },
    [display, error, operator, storedValue, waitingForOperand]
  );

  const equals = useCallback(() => {
    if (storedValue === null || operator === null || waitingForOperand || error) return;
    const result = calculate(storedValue, Number(display), operator);
    setExpression(`${formatResult(storedValue)} ${operator} ${display} =`);
    setWaitingForOperand(true);
    setStoredValue(null);
    setOperator(null);

    if (!result.ok) {
      setDisplay('Error');
      setError(result.message);
      return;
    }

    setDisplay(formatResult(result.value));
  }, [display, error, operator, storedValue, waitingForOperand]);

  const toggleSign = useCallback(() => {
    if (error || waitingForOperand || Number(display) === 0) return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  }, [display, error, waitingForOperand]);

  const applyPercent = useCallback(() => {
    if (error) return;
    setDisplay(formatResult(Number(display) / 100));
    setExpression('');
    setWaitingForOperand(false);
  }, [display, error]);

  const backspace = useCallback(() => {
    if (error) {
      clear();
      return;
    }
    if (waitingForOperand) return;
    const shortenedValue = display.slice(0, -1);
    setDisplay(shortenedValue === '' || shortenedValue === '-' ? '0' : shortenedValue);
    setExpression('');
  }, [clear, display, error, waitingForOperand]);

  useCalculatorKeyboard(
    enterDigit,
    enterDecimal,
    chooseOperator,
    equals,
    backspace,
    clear,
    applyPercent
  );

  return {
    display,
    expression,
    error,
    clear,
    enterDigit,
    enterDecimal,
    chooseOperator,
    equals,
    toggleSign,
    applyPercent,
    backspace,
  };
}
