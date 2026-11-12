import { z } from 'zod';

const identifier = z.string().trim().min(1).max(64);
const title = z.string().trim().min(1, 'Add a title.').max(120, 'Use 120 characters or fewer.');

export const boardInputSchema = z.object({
  title: z.string().trim().min(1, 'Name your board.').max(80, 'Use 80 characters or fewer.'),
});

export const boardUpdateSchema = boardInputSchema.extend({
  boardId: identifier,
});

export const boardIdSchema = z.object({ boardId: identifier });

export const columnInputSchema = z.object({
  boardId: identifier,
  title: z.string().trim().min(1, 'Name this column.').max(40, 'Use 40 characters or fewer.'),
});

export const columnIdSchema = z.object({
  boardId: identifier,
  columnId: identifier,
});

export const columnMoveSchema = columnIdSchema.extend({
  direction: z.enum(['left', 'right']),
});

const dueDate = z
  .string()
  .trim()
  .refine((value) => {
    if (value.length === 0) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Choose a valid due date.')
  .transform((value) => value || null);

export const taskInputSchema = z.object({
  boardId: identifier,
  columnId: identifier,
  title,
  description: z.string().trim().max(2000, 'Use 2,000 characters or fewer.').default(''),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  dueDate,
});

export const taskUpdateSchema = taskInputSchema.extend({
  taskId: identifier,
});

export const taskMoveSchema = z.object({
  boardId: identifier,
  taskId: identifier,
  targetColumnId: identifier,
});

export const taskDeleteSchema = z.object({
  boardId: identifier,
  taskId: identifier,
});

export const taskPageSchema = z.object({
  boardId: identifier,
  offset: z.number().int().min(0).max(10000),
});
