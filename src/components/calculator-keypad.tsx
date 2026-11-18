import type { CalculatorAction, Operator } from '@/lib/calculator';
import { CalculatorKey } from '@/components/calculator-key';
import { calculatorButtons } from '@/lib/calculator-keypad';

type CalculatorKeypadProps = {
  activeOperator: Operator | null;
  awaitingNewValue: boolean;
  onAction: (action: CalculatorAction) => void;
};

export function CalculatorKeypad({
  activeOperator,
  awaitingNewValue,
  onAction,
}: CalculatorKeypadProps) {
  return (
    <div role="group" aria-label="Calculator keypad" className="grid grid-cols-4 grid-rows-5 gap-2">
      {calculatorButtons.map((button) => (
        <CalculatorKey
          key={button.id}
          button={button}
          activeOperator={activeOperator}
          awaitingNewValue={awaitingNewValue}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
