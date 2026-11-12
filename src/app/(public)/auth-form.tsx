'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction, registerAction } from '@/app/actions/auth';
import { emptyActionState } from '@/lib/action-state';
import { SubmitButton } from '@/app/components/submit-button';

type AuthFormProps = { mode: 'login' | 'register' };

const inputClass = 'min-h-11 w-full rounded-control border border-border bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring';

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === 'login' ? loginAction : registerAction;
  const [state, formAction] = useActionState(action, emptyActionState);
  const isRegistration = mode === 'register';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-12">
      <section className="w-full rounded-container border border-border bg-card p-6 shadow-sm sm:p-8">
        <Link href="/login" className="font-heading text-xl font-bold tracking-tight">ClientNest</Link>
        <h1 className="mt-8 font-heading text-3xl font-semibold tracking-tight text-balance">
          {isRegistration ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isRegistration ? 'Start with your private ClientNest workspace.' : 'Sign in to continue to your workspace.'}
        </p>
        <form action={formAction} className="mt-8 grid gap-5">
          {state.error && <p role="alert" tabIndex={-1} className="rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
          {isRegistration && (
            <label className="grid gap-2 text-sm font-medium" htmlFor="name">
              Your name
              <input id="name" name="name" autoComplete="name" required maxLength={100} className={inputClass} />
              <FieldError message={state.fieldErrors?.name?.[0]} />
            </label>
          )}
          <label className="grid gap-2 text-sm font-medium" htmlFor="email">
            Email address
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
            <FieldError message={state.fieldErrors?.email?.[0]} />
          </label>
          <label className="grid gap-2 text-sm font-medium" htmlFor="password">
            Password
            <input id="password" name="password" type="password" autoComplete={isRegistration ? 'new-password' : 'current-password'} required minLength={isRegistration ? 12 : 1} maxLength={72} className={inputClass} />
            {isRegistration && <span className="text-xs font-normal text-muted-foreground">Use at least 12 characters.</span>}
            <FieldError message={state.fieldErrors?.password?.[0]} />
          </label>
          <SubmitButton pendingLabel={isRegistration ? 'Creating account…' : 'Signing in…'}>
            {isRegistration ? 'Create account' : 'Sign in'}
          </SubmitButton>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          {isRegistration ? 'Already have an account?' : 'New to ClientNest?'}{' '}
          <Link href={isRegistration ? '/login' : '/register'} className="font-semibold text-primary underline-offset-4 hover:underline">
            {isRegistration ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span role="alert" className="text-xs font-normal text-destructive">{message}</span> : null;
}
