'use server';

import { createContactSubmission } from '@/lib/contact-submission';
import { contactFormSchema } from '@/lib/contact-form-schema';

export type ContactFormState = {
  status: 'idle' | 'success' | 'invalid' | 'error';
  message?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    message?: string;
  };
};

export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const result = contactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      status: 'invalid',
      message: 'Please correct the fields below and try again.',
      fieldErrors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        message: fieldErrors.message?.[0],
      },
    };
  }

  try {
    await createContactSubmission(result.data);
    return { status: 'success', message: 'Your message has been sent.' };
  } catch (error) {
    console.error('Could not save contact form submission.', error);
    return {
      status: 'error',
      message: 'We could not send your message right now. Please try again.',
    };
  }
}
