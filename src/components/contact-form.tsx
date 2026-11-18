'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { submitContactForm, type ContactFormState } from '@/app/actions';
import { ContactField } from '@/components/contact-field';
import {
  validateContactField,
  type ContactFormField,
  type ContactFormValues,
} from '@/lib/contact-form-schema';

const initialState: ContactFormState = { status: 'idle' };

type FieldState = {
  touched: Partial<Record<ContactFormField, boolean>>;
  errors: Partial<Record<ContactFormField, string | undefined>>;
};

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, initialState);
  const [values, setValues] = useState<ContactFormValues>({ name: '', email: '', message: '' });
  const [fieldState, setFieldState] = useState<FieldState>({ touched: {}, errors: {} });
  const errorSummary = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.status === 'invalid') errorSummary.current?.focus();
  }, [state]);

  function updateField(field: ContactFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (fieldState.touched[field]) {
      setFieldState((current) => ({
        ...current,
        errors: { ...current.errors, [field]: validateContactField(field, value) },
      }));
    }
  }

  function validateOnBlur(field: ContactFormField, value: string) {
    setFieldState((current) => ({
      touched: { ...current.touched, [field]: true },
      errors: { ...current.errors, [field]: validateContactField(field, value) },
    }));
  }

  function fieldError(field: ContactFormField) {
    return fieldState.touched[field] ? fieldState.errors[field] : state.fieldErrors?.[field];
  }

  if (state.status === 'success') {
    return (
      <div className="space-y-3" role="status">
        <h2 className="font-heading text-foreground text-2xl font-semibold">
          Thanks for reaching out.
        </h2>
        <p className="text-muted-foreground text-base leading-7">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.status === 'invalid' && (
        <p
          ref={errorSummary}
          className="rounded-control border-destructive/40 bg-destructive/10 text-destructive focus-visible:outline-ring border px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
          role="alert"
          tabIndex={-1}
        >
          {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p
          className="rounded-control border-destructive/40 bg-destructive/10 text-destructive border px-4 py-3 text-base"
          role="alert"
        >
          {state.message}
        </p>
      )}

      <ContactField
        autoComplete="name"
        error={fieldError('name')}
        field="name"
        label="Your name"
        maxLength={80}
        onBlur={validateOnBlur}
        onChange={updateField}
        value={values.name}
      />
      <ContactField
        autoComplete="email"
        error={fieldError('email')}
        field="email"
        label="Email address"
        maxLength={254}
        onBlur={validateOnBlur}
        onChange={updateField}
        type="email"
        value={values.email}
      />
      <ContactField
        error={fieldError('message')}
        field="message"
        label="How can we help?"
        maxLength={5000}
        multiline
        onBlur={validateOnBlur}
        onChange={updateField}
        value={values.message}
      />

      <button
        className="rounded-control bg-primary text-primary-foreground focus-visible:outline-ring min-h-12 w-full px-5 text-base font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-40"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
