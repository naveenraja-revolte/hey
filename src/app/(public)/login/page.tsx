import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';

export const metadata: Metadata = { title: 'Sign in — ClientNest' };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
