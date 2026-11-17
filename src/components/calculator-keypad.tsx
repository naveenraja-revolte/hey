import { type CalculatorAction, type CalculatorState } from '@/lib/calculator';

const keys: {
  label: string;
  action: CalculatorAction;
  labelForScreenReader: string;
  style: 'utility' | 'operator' | 'number' | 'equals';
  span?: boolean;
}[] = [
  { label: 'AC', labelForScreenReader: 'Clear all', action: { type: 'clear' }, style: 'utility' },
  { label: '±', labelForScreenReader: 'Toggle sign', action: { type: 'sign' }, style: 'utility' },
  { label: '%', labelForScreenReader: 'Percent', action: { type: 'percent' }, style: 'utility' },
  {
    label: '÷',
    labelForScreenReader: 'Divide',
    action: { type: 'operator', value: '÷' },
    style: 'operator',
  },
  { label: '7', labelForScreenReader: '7', action: { type: 'digit', value: '7' }, style: 'number' },
  { label: '8', labelForScreenReader: '8', action: { type: 'digit', value: '8' }, style: 'number' },
  { label: '9', labelForScreenReader: '9', action: { type: 'digit', value: '9' }, style: 'number' },
  {
    label: '×',
    labelForScreenReader: 'Multiply',
    action: { type: 'operator', value: '×' },
    style: 'operator',
  },
  { label: '4', labelForScreenReader: '4', action: { type: 'digit', value: '4' }, style: 'number' },
  { label: '5', labelForScreenReader: '5', action: { type: 'digit', value: '5' }, style: 'number' },
  { label: '6', labelForScreenReader: '6', action: { type: 'digit', value: '6' }, style: 'number' },
  {
    label: '−',
    labelForScreenReader: 'Subtract',
    action: { type: 'operator', value: '−' },
    style: 'operator',
  },
  { label: '1', labelForScreenReader: '1', action: { type: 'digit', value: '1' }, style: 'number' },
  { label: '2', labelForScreenReader: '2', action: { type: 'digit', value: '2' }, style: 'number' },
  { label: '3', labelForScreenReader: '3', action: { type: 'digit', value: '3' }, style: 'number' },
  {
    label: '+',
    labelForScreenReader: 'Add',
    action: { type: 'operator', value: '+' },
    style: 'operator',
  },
  {
    label: '0',
    labelForScreenReader: '0',
    action: { type: 'digit', value: '0' },
    style: 'number',
    span: true,
  },
  {
    label: '.',
    labelForScreenReader: 'Decimal point',
    action: { type: 'decimal' },
    style: 'number',
  },
  {
    label: '⌫',
    labelForScreenReader: 'Backspace',
    action: { type: 'backspace' },
    style: 'utility',
  },
  { label: '=', labelForScreenReader: 'Equals', action: { type: 'equals' }, style: 'equals' },
];

const keyStyles = {
  utility: 'bg-muted text-foreground hover:bg-border',
  operator: 'bg-primary/10 text-primary hover:bg-primary/20',
  number: 'bg-card text-card-foreground hover:bg-muted',
  equals: 'bg-primary text-primary-foreground hover:bg-primary/90',
};

export function CalculatorKeypad({
  state,
  onAction,
}: {
  state: CalculatorState;
  onAction: (action: CalculatorAction) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Calculator keypad">
      {keys.map((key) => (
        <button
          key={key.label}
          type="button"
          aria-label={key.labelForScreenReader}
          aria-pressed={key.action.type === 'operator' && state.operator === key.action.value}
          onClick={() => onAction(key.action)}
          className={`rounded-control focus-visible:ring-ring focus-visible:ring-offset-background min-h-12 text-xl font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] ${key.span ? 'col-span-2' : ''} ${keyStyles[key.style]}`}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
