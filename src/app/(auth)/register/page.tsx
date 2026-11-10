import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';

export const metadata: Metadata = {
  title: 'Create an account · Dispatch Desk',
};

export default function RegisterPage() {
  return (
    <section className="auth-card">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>Dispatch Desk</span>
      </div>
      <span className="eyebrow">Join your support team</span>
      <h1>Create your account.</h1>
      <p className="auth-intro">An admin will confirm your team before ticket access is enabled.</p>
      <AuthForm mode="register" />
      <p className="auth-admin-note">Need help getting set up? Contact your team administrator.</p>
    </section>
  );
}
