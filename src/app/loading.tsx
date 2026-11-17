export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading the machine learning guide"
      className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16"
    >
      <p className="text-muted-foreground text-base">Loading the guide…</p>
    </main>
  );
}
