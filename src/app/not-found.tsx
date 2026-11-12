import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="auth-shell">
      <Link className="brand-lockup auth-brand" href="/boards">
        <span aria-hidden="true" className="brand-mark">
          F
        </span>
        <span>Fieldnotes</span>
      </Link>
      <section className="auth-panel not-found-panel">
        <p className="eyebrow">PAGE NOT FOUND</p>
        <h1>This page wandered off.</h1>
        <p className="auth-intro">It may have moved, or it may not belong to this account.</p>
        <Link className="button button-primary" href="/boards">
          Back to your boards
        </Link>
      </section>
    </main>
  );
}
