import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').trim(),
    type: z.enum(['Club', 'Producer', 'Restaurant', 'Private']),
    contactInfo: z
      .object({
        email: z.string().email('Invalid email address').optional().or(z.literal('')),
        phone: z.string().optional(),
      })
      .optional(),
    defaultEventPrice: z.number().optional(),
    color: z.enum(['indigo', 'sky', 'amber', 'emerald', 'rose', 'slate']).optional(),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Client ID is required'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').trim().optional(),
    type: z.enum(['Club', 'Producer', 'Restaurant', 'Private']).optional(),
    contactInfo: z
      .object({
        email: z.string().email('Invalid email address').optional().or(z.literal('')),
        phone: z.string().optional(),
      })
      .optional(),
    defaultEventPrice: z.number().optional(),
    color: z.enum(['indigo', 'sky', 'amber', 'emerald', 'rose', 'slate']).optional(),
  }),
});
