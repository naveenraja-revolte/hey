import type { CalculatorInput, CalculatorOperator } from '@/lib/calculator';

interface CalculatorKey {
  input: CalculatorInput;
  label: string;
  accessibleLabel: string;
  variant: 'utility' | 'digit' | 'operator' | 'equals';
}

interface CalculatorKeypadProps {
  activeOperator: CalculatorOperator | null;
  onInput: (input: CalculatorInput) => void;
}

const calculatorKeys: CalculatorKey[] = [
  {
    input: { type: 'action', value: 'clear' },
    label: 'AC',
    accessibleLabel: 'Clear all',
    variant: 'utility',
  },
  {
    input: { type: 'action', value: 'backspace' },
    label: '⌫',
    accessibleLabel: 'Backspace',
    variant: 'utility',
  },
  {
    input: { type: 'action', value: 'toggle-sign' },
    label: '±',
    accessibleLabel: 'Toggle sign',
    variant: 'utility',
  },
  {
    input: { type: 'action', value: 'percent' },
    label: '%',
    accessibleLabel: 'Percent',
    variant: 'utility',
  },
  { input: { type: 'digit', value: 7 }, label: '7', accessibleLabel: '7', variant: 'digit' },
  { input: { type: 'digit', value: 8 }, label: '8', accessibleLabel: '8', variant: 'digit' },
  { input: { type: 'digit', value: 9 }, label: '9', accessibleLabel: '9', variant: 'digit' },
  {
    input: { type: 'operator', value: 'divide' },
    label: '÷',
    accessibleLabel: 'Divide',
    variant: 'operator',
  },
  { input: { type: 'digit', value: 4 }, label: '4', accessibleLabel: '4', variant: 'digit' },
  { input: { type: 'digit', value: 5 }, label: '5', accessibleLabel: '5', variant: 'digit' },
  { input: { type: 'digit', value: 6 }, label: '6', accessibleLabel: '6', variant: 'digit' },
  {
    input: { type: 'operator', value: 'multiply' },
    label: '×',
    accessibleLabel: 'Multiply',
    variant: 'operator',
  },
  { input: { type: 'digit', value: 1 }, label: '1', accessibleLabel: '1', variant: 'digit' },
  { input: { type: 'digit', value: 2 }, label: '2', accessibleLabel: '2', variant: 'digit' },
  { input: { type: 'digit', value: 3 }, label: '3', accessibleLabel: '3', variant: 'digit' },
  {
    input: { type: 'operator', value: 'subtract' },
    label: '−',
    accessibleLabel: 'Subtract',
    variant: 'operator',
  },
  { input: { type: 'digit', value: 0 }, label: '0', accessibleLabel: '0', variant: 'digit' },
  {
    input: { type: 'action', value: 'decimal' },
    label: '.',
    accessibleLabel: 'Decimal point',
    variant: 'utility',
  },
  {
    input: { type: 'operator', value: 'add' },
    label: '+',
    accessibleLabel: 'Add',
    variant: 'operator',
  },
  {
    input: { type: 'action', value: 'equals' },
    label: '=',
    accessibleLabel: 'Equals',
    variant: 'equals',
  },
];

const baseButtonClassName =
  'min-h-14 w-full rounded-control border border-border px-2 text-xl font-medium leading-6 transition-[background-color,color,transform,box-shadow] duration-150 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] motion-reduce:transition-none';

function getButtonClassName(key: CalculatorKey, activeOperator: CalculatorOperator | null): string {
  if (key.variant === 'equals') {
    return `${baseButtonClassName} border-primary bg-primary text-primary-foreground hover:bg-primary/90`;
  }

  if (key.variant === 'operator') {
    const isActive = key.input.type === 'operator' && key.input.value === activeOperator;
    return isActive
      ? `${baseButtonClassName} border-primary bg-primary text-primary-foreground`
      : `${baseButtonClassName} border-accent bg-accent text-accent-foreground hover:bg-accent/90`;
  }

  if (key.variant === 'digit') {
    return `${baseButtonClassName} bg-card text-card-foreground hover:bg-muted`;
  }

  return `${baseButtonClassName} bg-muted text-foreground hover:bg-border`;
}

export function CalculatorKeypad({ activeOperator, onInput }: CalculatorKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Calculator keypad">
      {calculatorKeys.map((key) => (
        <button
          key={key.accessibleLabel}
          type="button"
          aria-label={key.accessibleLabel}
          aria-pressed={
            key.input.type === 'operator' ? activeOperator === key.input.value : undefined
          }
          className={getButtonClassName(key, activeOperator)}
          onClick={() => onInput(key.input)}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
