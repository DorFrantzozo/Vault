import { z } from 'zod';

export const createEventSchema = z.object({
  body: z.object({
    client: z.string().min(1, 'Client ID is required'),
    type: z.enum(['DJ Gig', 'Software Development', 'Maintenance', 'Consulting']),
    date: z.string().or(z.string().datetime()),
    description: z.string().optional(),
    status: z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
  }),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Event ID is required'),
  }),
  body: z.object({
    client: z.string().optional(),
    type: z.enum(['DJ Gig', 'Software Development', 'Maintenance', 'Consulting']).optional(),
    date: z.string().or(z.string().datetime()).optional(),
    description: z.string().optional(),
    status: z.enum(['Scheduled', 'Completed', 'Cancelled']).optional(),
  }),
});
