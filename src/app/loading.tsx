export default function Loading() {
  return (
    <main
      aria-label="Loading the AI and machine learning guide"
      aria-busy="true"
      className="mx-auto min-h-screen w-full max-w-6xl space-y-8 px-6 py-16"
    >
      <div className="rounded-control bg-muted h-14 max-w-lg animate-pulse" />
      <div className="rounded-control bg-muted h-6 max-w-2xl animate-pulse" />
      <div className="rounded-container bg-muted h-72 max-w-2xl animate-pulse" />
    </main>
  );
}
