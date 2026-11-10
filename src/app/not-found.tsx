import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="error-shell">
      <span className="eyebrow">Not found</span>
      <h1>This ticket isn’t available.</h1>
      <p>It may have been removed, or it may not be assigned to your account.</p>
      <Link className="button button-secondary" href="/tickets">Return to your queue</Link>
    </main>
  );
}
