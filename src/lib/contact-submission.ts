import { db } from '@/db';
import { contactSubmissions } from '@/db/schema';
import type { ContactFormValues } from '@/lib/contact-form-schema';

export async function createContactSubmission(values: ContactFormValues): Promise<void> {
  await db.insert(contactSubmissions).values(values);
}
