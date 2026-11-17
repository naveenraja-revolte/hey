const skeletonKeys = [
  'clear',
  'sign',
  'percent',
  'divide',
  'seven',
  'eight',
  'nine',
  'multiply',
  'four',
  'five',
  'six',
  'subtract',
  'one',
  'two',
  'three',
  'add',
  'zero',
  'decimal',
  'backspace',
  'equals',
];

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className="rounded-container border-border bg-card w-full max-w-sm animate-pulse border p-5 shadow-sm sm:p-6"
        role="status"
        aria-label="Loading calculator"
      >
        <div className="rounded-control bg-muted mb-6 h-7 w-32" />
        <div className="rounded-control bg-muted mb-5 h-24" />
        <div className="grid grid-cols-4 gap-2">
          {skeletonKeys.map((key) => (
            <div
              key={key}
              className={`rounded-control bg-muted h-12 ${key === 'zero' ? 'col-span-2' : ''}`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
