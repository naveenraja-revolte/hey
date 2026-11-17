export default function ShipmentsLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 sm:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading shipments"
    >
      <div className="rounded-control bg-muted h-10 w-1/2 animate-pulse" />
      <div className="rounded-container bg-muted h-16 animate-pulse" />
      {Array.from({ length: 6 }, (_, row) => (
        <div
          key={`shipment-skeleton-${row}`}
          className="rounded-container bg-muted h-16 animate-pulse"
        />
      ))}
    </main>
  );
}
