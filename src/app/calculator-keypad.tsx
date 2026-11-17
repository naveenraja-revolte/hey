import type { Operator } from '@/lib/calculator';

type KeyTone = 'utility' | 'number' | 'operator' | 'equals';

type CalculatorKey = {
  label: string;
  value: string;
  tone: KeyTone;
  accessibleName?: string;
  className?: string;
};

type CalculatorKeypadProps = {
  onPress: (key: string) => void;
  selectedOperator: Operator | null;
};

const keys: CalculatorKey[] = [
  { label: 'AC', value: 'AC', tone: 'utility', accessibleName: 'Clear all' },
  { label: '⌫', value: 'DEL', tone: 'utility', accessibleName: 'Delete last digit' },
  { label: '÷', value: '/', tone: 'operator', accessibleName: 'Divide' },
  { label: '×', value: '*', tone: 'operator', accessibleName: 'Multiply' },
  { label: '7', value: '7', tone: 'number' },
  { label: '8', value: '8', tone: 'number' },
  { label: '9', value: '9', tone: 'number' },
  { label: '−', value: '-', tone: 'operator', accessibleName: 'Subtract' },
  { label: '4', value: '4', tone: 'number' },
  { label: '5', value: '5', tone: 'number' },
  { label: '6', value: '6', tone: 'number' },
  { label: '+', value: '+', tone: 'operator', accessibleName: 'Add' },
  { label: '1', value: '1', tone: 'number' },
  { label: '2', value: '2', tone: 'number' },
  { label: '3', value: '3', tone: 'number' },
  {
    label: '=',
    value: '=',
    tone: 'equals',
    accessibleName: 'Equals',
    className: 'row-span-2',
  },
  { label: '0', value: '0', tone: 'number', className: 'col-span-2' },
  { label: '.', value: '.', tone: 'number', accessibleName: 'Decimal point' },
];

const keyToneClasses: Record<KeyTone, string> = {
  utility: 'border-border bg-muted text-foreground hover:bg-border',
  number: 'border-border bg-card text-card-foreground hover:bg-muted',
  operator: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  equals: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
};

export default function CalculatorKeypad({ onPress, selectedOperator }: CalculatorKeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Calculator keypad">
      {keys.map((key) => (
        <button
          key={key.value}
          type="button"
          aria-label={key.accessibleName ?? key.label}
          aria-pressed={key.tone === 'operator' ? key.value === selectedOperator : undefined}
          onClick={() => onPress(key.value)}
          className={`focus-visible:outline-ring min-h-14 rounded-[var(--radius-control)] border px-3 text-lg font-medium transition-[transform,background-color,border-color,color] duration-150 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ${keyToneClasses[key.tone]} ${key.className ?? ''}`}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
