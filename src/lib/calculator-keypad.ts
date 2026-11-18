import type { CalculatorAction } from '@/lib/calculator';

export type CalculatorButtonVariant = 'digit' | 'utility' | 'clear' | 'operator' | 'equals';

export type CalculatorButton = {
  id: string;
  label: string;
  accessibleLabel: string;
  action: CalculatorAction;
  variant: CalculatorButtonVariant;
  className?: string;
};

function digitButtons(digits: string[]): CalculatorButton[] {
  return digits.map((digit) => ({
    id: `digit-${digit}`,
    label: digit,
    accessibleLabel: digit,
    action: { type: 'digit', value: digit },
    variant: 'digit',
  }));
}

export const calculatorButtons: CalculatorButton[] = [
  {
    id: 'clear',
    label: 'AC',
    accessibleLabel: 'Clear all',
    action: { type: 'clear' },
    variant: 'clear',
  },
  {
    id: 'backspace',
    label: '⌫',
    accessibleLabel: 'Delete last digit',
    action: { type: 'backspace' },
    variant: 'utility',
  },
  {
    id: 'divide',
    label: '÷',
    accessibleLabel: 'Divide',
    action: { type: 'operator', value: '÷' },
    variant: 'operator',
  },
  {
    id: 'multiply',
    label: '×',
    accessibleLabel: 'Multiply',
    action: { type: 'operator', value: '×' },
    variant: 'operator',
  },
  ...digitButtons(['7', '8', '9']),
  {
    id: 'subtract',
    label: '−',
    accessibleLabel: 'Subtract',
    action: { type: 'operator', value: '−' },
    variant: 'operator',
  },
  ...digitButtons(['4', '5', '6']),
  {
    id: 'add',
    label: '+',
    accessibleLabel: 'Add',
    action: { type: 'operator', value: '+' },
    variant: 'operator',
  },
  ...digitButtons(['1', '2', '3']),
  {
    id: 'equals',
    label: '=',
    accessibleLabel: 'Equals',
    action: { type: 'equals' },
    variant: 'equals',
    className: 'row-span-2',
  },
  {
    id: 'digit-0',
    label: '0',
    accessibleLabel: '0',
    action: { type: 'digit', value: '0' },
    variant: 'digit',
    className: 'col-span-2',
  },
  {
    id: 'decimal',
    label: '.',
    accessibleLabel: 'Decimal point',
    action: { type: 'decimal' },
    variant: 'digit',
  },
];
