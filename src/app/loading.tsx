export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading contact form"
      className="mx-auto grid min-h-screen w-full max-w-3xl content-center px-4 py-12 sm:px-8"
      id="main"
      role="status"
    >
      <div className="rounded-container border-t-primary bg-card space-y-6 border border-t-4 p-6 shadow-md sm:p-10">
        <div className="rounded-control bg-muted h-10 w-56 animate-pulse" />
        <div className="rounded-control bg-muted h-6 w-full max-w-sm animate-pulse" />
        <div className="space-y-5">
          <div className="rounded-control bg-muted h-20 animate-pulse" />
          <div className="rounded-control bg-muted h-20 animate-pulse" />
          <div className="rounded-control bg-muted h-36 animate-pulse" />
          <div className="rounded-control bg-muted h-12 w-40 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
