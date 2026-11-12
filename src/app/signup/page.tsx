import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = { title: 'Create an account' };

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <Link aria-label="Fieldnotes home" className="brand-lockup auth-brand" href="/">
        <span aria-hidden="true" className="brand-mark">
          F
        </span>
        <span>Fieldnotes</span>
      </Link>
      <section className="auth-panel">
        <p className="eyebrow">START WITH A CLEAN PAGE</p>
        <h1>Make room for what’s next.</h1>
        <p className="auth-intro">Create an account. Your boards will be private to you.</p>
        <AuthForm mode="signup" />
      </section>
      <p className="auth-footer">One person, one private workspace. Teams can come later.</p>
    </main>
  );
}
