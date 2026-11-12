import { z } from 'zod';

export const leadStatuses = [
  'New',
  'Contacted',
  'Qualified',
  'Negotiation',
  'Converted',
  'Lost',
] as const;

export const projectStatuses = ['Planned', 'Active', 'On hold', 'Completed', 'Cancelled'] as const;
export const pageSize = 20;
export const upcomingDays = 30;

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .refine((value) => value === '' || z.email().safeParse(value).success, {
    message: 'Enter a valid email address.',
  });

export const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(100),
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(12, 'Use at least 12 characters.').max(72).refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Password must be at most 72 bytes.',
  ),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(1).max(128),
});

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, 'Enter a workspace name.').max(100),
});

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Enter a client name.').max(120),
  email: optionalEmail,
  phone: z.string().trim().max(40),
  company: z.string().trim().max(120),
  notes: z.string().trim().max(5000),
});

export const leadSchema = z.object({
  name: z.string().trim().min(1, 'Enter a lead name.').max(120),
  email: optionalEmail,
  phone: z.string().trim().max(40),
  company: z.string().trim().max(120),
  source: z.string().trim().min(1, 'Enter a lead source.').max(100),
  status: z.enum(leadStatuses),
  notes: z.string().trim().max(5000),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Enter a project name.').max(160),
  clientId: z.string().min(1, 'Choose a client.'),
  description: z.string().trim().max(5000),
  budget: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{1,9}(\.\d{1,2})?$/.test(value), {
      message: 'Enter a budget with up to two decimal places.',
    }),
  deadline: z.string().refine((value) => {
    if (value === '') return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, { message: 'Choose a valid deadline.' }),
  status: z.enum(projectStatuses),
});

export type LeadStatus = (typeof leadStatuses)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
