import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Link aria-label="Fieldnotes home" className="brand-lockup auth-brand" href="/">
        <span aria-hidden="true" className="brand-mark">
          F
        </span>
        <span>Fieldnotes</span>
      </Link>
      <section className="auth-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Pick up where you left off.</h1>
        <p className="auth-intro">Sign in to return to your boards.</p>
        <AuthForm mode="login" />
      </section>
      <p className="auth-footer">Your work stays private to your account.</p>
    </main>
  );
}
