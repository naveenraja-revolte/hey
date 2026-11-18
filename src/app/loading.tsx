import { calculatorButtons } from '@/lib/calculator-keypad';

export default function Loading() {
  return (
    <main
      aria-label="Loading calculator"
      aria-busy="true"
      className="bg-background grid min-h-dvh place-items-center px-4 py-8"
    >
      <div className="rounded-container border-border bg-card w-full max-w-sm animate-pulse border p-6">
        <div className="rounded-control bg-muted mb-4 h-20" />
        <div className="grid grid-cols-4 gap-2">
          {calculatorButtons.map((button) => (
            <div
              key={button.id}
              className={`rounded-control bg-muted min-h-12 ${button.className ?? ''}`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
