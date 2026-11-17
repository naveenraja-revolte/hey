import { z } from 'zod';
import { DELIVERY_STATUSES } from './domain';

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const signInSchema = z.object({
  email: z
    .email('Enter a valid email address')
    .max(254)
    .transform((email) => email.toLowerCase()),
  password: z.string().min(12, 'Password must be at least 12 characters').max(200),
});

export const deliverySchema = z.object({
  recipientName: requiredText('Recipient name', 120),
  recipientPhone: requiredText('Recipient phone', 32),
  pickupAddress: requiredText('Pickup address', 300),
  dropoffAddress: requiredText('Drop-off address', 300),
  parcelDescription: requiredText('Parcel description', 240),
  notes: z.string().trim().max(1000, 'Notes must be under 1000 characters').optional(),
});

export const courierSchema = z.object({
  name: requiredText('Courier name', 120),
  phone: requiredText('Phone number', 32),
  email: z
    .email('Enter a valid email address')
    .max(254)
    .transform((email) => email.toLowerCase()),
});

export const courierUpdateSchema = courierSchema.partial().extend({
  active: z.boolean().optional(),
});

export const deliveryUpdateSchema = z.union([
  z.object({ status: z.enum(DELIVERY_STATUSES) }).strict(),
  z.object({ courierId: z.number().int().positive().nullable() }).strict(),
]);

export const deliveryQuerySchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.union([z.enum(DELIVERY_STATUSES), z.literal('')]).default(''),
  courierId: z.union([z.coerce.number().int().positive(), z.literal('')]).default(''),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
});

export const courierQuerySchema = z.object({
  q: z.string().trim().max(120).default(''),
  page: z.coerce.number().int().min(1).default(1),
});
