const skeletonKeyIds = [
  'clear',
  'delete',
  'divide',
  'multiply',
  'seven',
  'eight',
  'nine',
  'subtract',
  'four',
  'five',
  'six',
  'add',
  'one',
  'two',
  'three',
  'equals',
  'zero',
  'decimal',
] as const;

export default function Loading() {
  return (
    <main
      aria-label="Loading calculator"
      className="flex min-h-screen items-center justify-center px-4 py-8"
    >
      <div className="border-border bg-card w-full max-w-sm animate-pulse rounded-[var(--radius-container)] border p-5 motion-reduce:animate-none">
        <div className="bg-muted mb-5 h-9 rounded-[var(--radius-control)]" />
        <div className="bg-muted mb-5 h-28 rounded-[var(--radius-control)]" />
        <div className="grid grid-cols-4 gap-2">
          {skeletonKeyIds.map((keyId) => (
            <div key={keyId} className="bg-muted min-h-14 rounded-[var(--radius-control)]" />
          ))}
        </div>
      </div>
    </main>
  );
}
