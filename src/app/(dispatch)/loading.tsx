export default function DispatchLoading() {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-label="Loading dispatch data"
      className="space-y-6"
    >
      <div className="rounded-control bg-muted h-9 w-48 animate-pulse" />
      <div className="rounded-container bg-muted h-14 w-full animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="rounded-container bg-muted h-14 animate-pulse" />
        ))}
      </div>
    </section>
  );
}
