import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Sign in · Dispatch Desk',
};

export default function LoginPage() {
  return (
    <section className="auth-card">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>Dispatch Desk</span>
      </div>
      <span className="eyebrow">Team support workspace</span>
      <h1>Good to have you back.</h1>
      <p className="auth-intro">Sign in to check your queue and keep work moving.</p>
      <AuthForm mode="login" />
      <p className="auth-admin-note">The first administrator account is provisioned during setup.</p>
    </section>
  );
}
