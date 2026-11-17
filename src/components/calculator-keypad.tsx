'use client';

type CalculatorAction =
  'clear' | 'backspace' | 'sign' | 'percent' | 'operator' | 'digit' | 'decimal' | 'equals';

type CalculatorKey = {
  label: string;
  accessibleLabel: string;
  action: CalculatorAction;
  value: string;
};

const keypad: CalculatorKey[] = [
  { label: 'AC', accessibleLabel: 'Clear all', action: 'clear', value: '' },
  { label: '⌫', accessibleLabel: 'Delete last digit', action: 'backspace', value: '' },
  { label: '±', accessibleLabel: 'Toggle sign', action: 'sign', value: '' },
  { label: '÷', accessibleLabel: 'Divide', action: 'operator', value: '÷' },
  { label: '7', accessibleLabel: '7', action: 'digit', value: '7' },
  { label: '8', accessibleLabel: '8', action: 'digit', value: '8' },
  { label: '9', accessibleLabel: '9', action: 'digit', value: '9' },
  { label: '×', accessibleLabel: 'Multiply', action: 'operator', value: '×' },
  { label: '4', accessibleLabel: '4', action: 'digit', value: '4' },
  { label: '5', accessibleLabel: '5', action: 'digit', value: '5' },
  { label: '6', accessibleLabel: '6', action: 'digit', value: '6' },
  { label: '−', accessibleLabel: 'Subtract', action: 'operator', value: '−' },
  { label: '1', accessibleLabel: '1', action: 'digit', value: '1' },
  { label: '2', accessibleLabel: '2', action: 'digit', value: '2' },
  { label: '3', accessibleLabel: '3', action: 'digit', value: '3' },
  { label: '+', accessibleLabel: 'Add', action: 'operator', value: '+' },
  { label: '%', accessibleLabel: 'Percent', action: 'percent', value: '' },
  { label: '0', accessibleLabel: '0', action: 'digit', value: '0' },
  { label: '.', accessibleLabel: 'Decimal point', action: 'decimal', value: '' },
  { label: '=', accessibleLabel: 'Equals', action: 'equals', value: '' },
];

const buttonClasses =
  'flex min-h-12 items-center justify-center rounded-lg border border-border text-lg font-medium transition duration-150 ease-out hover:brightness-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

type CalculatorKeypadProps = {
  onAction: (action: CalculatorAction, value: string) => void;
};

export type { CalculatorAction };

export function CalculatorKeypad({ onAction }: CalculatorKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {keypad.map((key) => {
        const isPrimary = key.action === 'operator' || key.action === 'equals';

        return (
          <button
            key={key.accessibleLabel}
            type="button"
            aria-label={key.accessibleLabel}
            className={`${buttonClasses} ${isPrimary ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            onClick={() => onAction(key.action, key.value)}
          >
            {key.label}
          </button>
        );
      })}
    </div>
  );
}
