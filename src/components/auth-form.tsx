'use client';

import Link from 'next/link';
import { FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') ?? '');
    const name = String(formData.get('name') ?? '').trim();

    startTransition(async () => {
      try {
        const result = isSignup
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password });

        if (result.error) {
          setError(
            isSignup ? result.error.message : 'That email and password combination did not match.'
          );
          return;
        }

        router.replace('/boards');
        router.refresh();
      } catch (cause) {
        console.error('Account access failed', cause);
        setError('We could not sign you in right now. Please try again.');
      }
    });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignup ? (
        <label className="field-label">
          Name
          <input
            autoComplete="name"
            autoFocus
            className="text-input"
            maxLength={80}
            name="name"
            placeholder="How should we address you?"
            required
          />
        </label>
      ) : null}
      <label className="field-label">
        Email address
        <input
          autoComplete="email"
          autoFocus={!isSignup}
          className="text-input"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>
      <label className="field-label">
        Password
        <input
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="text-input"
          minLength={8}
          name="password"
          placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
          required
          type="password"
        />
      </label>
      {error ? (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button-primary auth-submit" disabled={pending} type="submit">
        {pending ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
      </button>
      <p className="auth-switch">
        {isSignup ? 'Already have an account?' : 'New to Fieldnotes?'}{' '}
        <Link href={isSignup ? '/login' : '/signup'}>
          {isSignup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
      <p className="auth-note">Password reset by email is not available yet.</p>
    </form>
  );
}
