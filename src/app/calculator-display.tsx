interface CalculatorDisplayProps {
  display: string;
  expression: string;
  error: string | null;
}

export function CalculatorDisplay({ display, expression, error }: CalculatorDisplayProps) {
  return (
    <div className="rounded-container border-border bg-muted mb-4 border px-4 py-4 text-right">
      <p className="text-muted-foreground min-h-6 text-base" aria-live="polite">
        {error ?? (expression || '\u00a0')}
      </p>
      <output
        aria-label="Calculator display"
        aria-live={error ? 'assertive' : 'polite'}
        className="text-foreground block min-h-12 font-mono text-4xl leading-tight font-medium tracking-tight break-all sm:text-5xl"
      >
        {error ? 'Error' : display}
      </output>
      {error && (
        <p className="sr-only" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
