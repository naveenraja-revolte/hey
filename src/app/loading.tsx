export default function Loading() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-4 py-8">
      <section
        className="rounded-container border-border bg-card w-full max-w-sm border p-5 sm:p-6"
        aria-label="Loading calculator"
      >
        <p className="sr-only">Loading calculator</p>
        <div className="rounded-control bg-muted mb-4 h-24 animate-pulse" />
        <div className="grid grid-cols-4 gap-2" aria-hidden="true">
          {Array.from({ length: 20 }, (_, keyIndex) => (
            <div key={keyIndex} className="rounded-control bg-muted h-14 animate-pulse" />
          ))}
        </div>
      </section>
    </main>
  );
}
