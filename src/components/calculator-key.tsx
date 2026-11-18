import type { CalculatorButton, CalculatorButtonVariant } from '@/lib/calculator-keypad';
import type { CalculatorAction, Operator } from '@/lib/calculator';

type CalculatorKeyProps = {
  button: CalculatorButton;
  activeOperator: Operator | null;
  awaitingNewValue: boolean;
  onAction: (action: CalculatorAction) => void;
};

const buttonVariants: Record<CalculatorButtonVariant, string> = {
  digit: 'bg-card text-card-foreground hover:bg-muted',
  utility: 'bg-muted text-muted-foreground hover:bg-border',
  clear: 'bg-muted text-destructive hover:bg-border',
  operator: 'bg-muted text-primary hover:bg-primary/10',
  equals: 'bg-primary text-primary-foreground hover:bg-primary/90',
};

export function CalculatorKey({
  button,
  activeOperator,
  awaitingNewValue,
  onAction,
}: CalculatorKeyProps) {
  const isActiveOperator =
    button.action.type === 'operator' && activeOperator === button.action.value && awaitingNewValue;

  return (
    <button
      type="button"
      aria-label={button.accessibleLabel}
      aria-pressed={button.action.type === 'operator' ? isActiveOperator : undefined}
      onClick={() => onAction(button.action)}
      className={`rounded-control border-border focus-visible:outline-ring min-h-12 border font-sans text-xl font-medium transition-[transform,background-color,color] duration-150 ease-out hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] ${buttonVariants[button.variant]} ${button.className ?? ''} ${isActiveOperator ? 'ring-primary/30 ring-2' : ''}`}
    >
      {button.label}
    </button>
  );
}
