'use client';

import { useCallback, useEffect, useState } from 'react';
import { calculateExpression, CalculatorInputError, formatResult } from './calculator-logic';

interface Key {
  value: string;
  label: string;
  className?: string;
}

const keypadRows: Key[][] = [
  [
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '/', label: '÷', className: 'key--operator' },
  ],
  [
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '*', label: '×', className: 'key--operator' },
  ],
  [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '-', label: '−', className: 'key--operator' },
  ],
  [
    { value: '0', label: '0' },
    { value: '.', label: '.' },
    { value: '+', label: '+', className: 'key--operator' },
    { value: '=', label: '=', className: 'key--equals' },
  ],
];

function isOperator(value: string): boolean {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

function getCurrentNumber(expression: string): string {
  let start = expression.length - 1;

  while (start >= 0) {
    const character = expression[start];

    if (
      character === '+' ||
      character === '-' ||
      character === '*' ||
      character === '/' ||
      character === '('
    ) {
      break;
    }

    start -= 1;
  }

  return expression.slice(start + 1);
}

function formatExpression(value: string): string {
  return value.replaceAll('*', '×').replaceAll('/', '÷').replaceAll('-', '−');
}

function getKeyLabel(key: Key): string {
  if (key.value === '.') {
    return 'Decimal point';
  }

  if (isOperator(key.value)) {
    return `${key.label} operation`;
  }

  return key.label;
}

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultValue, setResultValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setExpression('');
    setResult(null);
    setResultValue(null);
    setError(null);
  }, []);

  const deleteLast = useCallback(() => {
    setExpression((current) => current.slice(0, -1));
    setResult(null);
    setResultValue(null);
    setError(null);
  }, []);

  const calculate = useCallback(() => {
    if (!expression.trim()) {
      return;
    }

    try {
      const value = calculateExpression(expression);
      setResult(formatResult(value));
      setResultValue(value);
      setError(null);
    } catch (caught: unknown) {
      if (caught instanceof CalculatorInputError) {
        setResult(null);
        setResultValue(null);
        setError(caught.message);
        return;
      }

      setResult(null);
      setResultValue(null);
      setError('The calculation could not be completed. Edit it and try again.');
    }
  }, [expression]);

  const insert = useCallback(
    (input: string) => {
      const continuesResult = resultValue !== null && isOperator(input);
      const base = resultValue === null ? expression : continuesResult ? String(resultValue) : '';
      let nextInput = input;

      if (input === '.') {
        const currentNumber = getCurrentNumber(base);

        if (currentNumber.includes('.')) {
          return;
        }

        if (!currentNumber) {
          nextInput = '0.';
        }
      }

      setExpression(`${base}${nextInput}`);
      setResult(null);
      setResultValue(null);
      setError(null);
    },
    [expression, resultValue]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        clear();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        deleteLast();
        return;
      }

      if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        calculate();
        return;
      }

      const isDigit = event.key >= '0' && event.key <= '9';
      const isCalculatorKey = ['.', '+', '-', '*', '/', '(', ')'].includes(event.key);

      if (isDigit || isCalculatorKey) {
        event.preventDefault();
        insert(event.key);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calculate, clear, deleteLast, insert]);

  return (
    <main className="calculator-page">
      <section className="calculator" aria-labelledby="calculator-title">
        <header className="calculator-header">
          <div>
            <p className="eyebrow">SUM / 01</p>
            <h1 id="calculator-title">Calculator</h1>
          </div>
          <p className="header-note">
            Everyday arithmetic
            <br />
            made clear.
          </p>
        </header>

        <div className="calculator-display">
          <div className="expression-block">
            <span className="display-label">Expression</span>
            <p
              className="expression-value"
              role="status"
              aria-label="Current expression"
              aria-live="polite"
              aria-atomic="true"
            >
              {expression ? formatExpression(expression) : 'Enter a calculation'}
            </p>
          </div>
          <div className="result-block">
            <span className="display-label">Result</span>
            <output
              className={`result-value${result ? 'result-value--active' : ''}`}
              aria-label={result ? `Result ${result}` : 'Result'}
              aria-live="polite"
              aria-atomic="true"
            >
              {result ?? (expression ? '—' : '0')}
            </output>
          </div>
        </div>

        <div className="keypad-utility" role="group" aria-label="Calculator controls">
          <button className="key key--utility" type="button" onClick={clear} aria-label="Clear all">
            AC
          </button>
          <button
            className="key key--utility"
            type="button"
            onClick={deleteLast}
            disabled={!expression}
            aria-label="Delete last character"
          >
            DEL
          </button>
          <button
            className="key key--utility"
            type="button"
            onClick={() => insert('(')}
            aria-label="Open parenthesis"
          >
            (
          </button>
          <button
            className="key key--utility"
            type="button"
            onClick={() => insert(')')}
            aria-label="Close parenthesis"
          >
            )
          </button>
        </div>

        <div className="keypad" role="group" aria-label="Number and operation keys">
          {keypadRows.flatMap((row, rowIndex) =>
            row.map((key) =>
              key.value === '=' ? (
                <button
                  className={`key ${key.className ?? ''}`}
                  type="button"
                  key={key.value}
                  onClick={calculate}
                  disabled={!expression.trim()}
                  aria-label="Calculate result"
                >
                  {key.label}
                </button>
              ) : (
                <button
                  className={`key ${key.className ?? ''}`}
                  type="button"
                  key={`${rowIndex}-${key.value}`}
                  onClick={() => insert(key.value)}
                  aria-label={getKeyLabel(key)}
                >
                  {key.label}
                </button>
              )
            )
          )}
        </div>

        <p className="calculator-error" role="alert" aria-live="assertive">
          {error ?? ''}
        </p>
        <footer className="calculator-footer">
          <span>Enter or = to calculate</span>
          <span>Esc to clear</span>
        </footer>
      </section>
    </main>
  );
}
