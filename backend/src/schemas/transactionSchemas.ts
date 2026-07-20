import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['Income', 'Expense']),
    amount: z.coerce.number().positive('Amount must be positive'),
    date: z.string().or(z.string().datetime()),
    client: z.string().optional(),
    relatedEvent: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z.object({
    type: z.enum(['Income', 'Expense']).optional(),
    amount: z.coerce.number().positive('Amount must be positive').optional(),
    date: z.string().or(z.string().datetime()).optional(),
    client: z.string().optional(),
    relatedEvent: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const transactionFilterSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['Income', 'Expense']).optional(),
    client: z.string().optional(),
  }),
});
