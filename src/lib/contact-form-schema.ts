import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80, 'Use 80 characters or fewer.'),
  email: z.email('Enter a valid email address.').max(254, 'Use 254 characters or fewer.'),
  message: z
    .string()
    .trim()
    .min(10, 'Your message must be at least 10 characters.')
    .max(5000, 'Use 5,000 characters or fewer.'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type ContactFormField = keyof ContactFormValues;

export function validateContactField(field: ContactFormField, value: string): string | undefined {
  const result = contactFormSchema.shape[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
