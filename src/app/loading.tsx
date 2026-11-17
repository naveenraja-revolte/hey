export default function Loading() {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading parcel information"
    >
      <div className="rounded-control bg-muted h-10 w-2/3 animate-pulse" />
      <div className="rounded-container bg-muted h-32 w-full animate-pulse" />
    </main>
  );
}
