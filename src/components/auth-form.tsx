'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';

type AuthFormProps = {
  mode: 'login' | 'register';
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isRegistration = mode === 'register';

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    startTransition(async () => {
      try {
        if (isRegistration) {
          const result = await authClient.signUp.email({ name, email, password });

          if (result.error) {
            setError('We could not create that account. Check the details or try signing in.');
            return;
          }

          setNotice('Account created. An administrator must add you to a team before you can access tickets.');
          event.currentTarget.reset();
          return;
        }

        const result = await authClient.signIn.email({ email, password });

        if (result.error) {
          setError('Sign-in failed. Check your email and password and try again.');
          return;
        }

        router.replace('/');
        router.refresh();
      } catch {
        setError('We could not reach the sign-in service. Please try again.');
      }
    });
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {isRegistration && (
        <label className="field">
          <span>Full name</span>
          <input
            autoComplete="name"
            maxLength={80}
            minLength={2}
            name="name"
            required
          />
        </label>
      )}
      <label className="field">
        <span>Work email</span>
        <input
          autoComplete="email"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          autoComplete={isRegistration ? 'new-password' : 'current-password'}
          maxLength={128}
          minLength={8}
          name="password"
          required
          type="password"
        />
        {isRegistration && <small>Use at least 8 characters.</small>}
      </label>
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {notice && <p className="form-message form-message-success" role="status">{notice}</p>}
      <button className="button button-primary button-full" disabled={pending} type="submit">
        {pending ? 'Please wait…' : isRegistration ? 'Create account' : 'Sign in'}
      </button>
      <p className="form-footnote">
        {isRegistration ? 'Already have an account?' : 'New to the team?'}{' '}
        <Link href={isRegistration ? '/login' : '/register'}>
          {isRegistration ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
