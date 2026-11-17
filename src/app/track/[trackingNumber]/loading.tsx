export default function TrackingLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-10 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading tracking history"
    >
      <div className="rounded-container bg-muted h-40 animate-pulse" />
      <div className="rounded-container bg-muted h-80 animate-pulse" />
    </main>
  );
}
