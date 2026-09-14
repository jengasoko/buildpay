import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or fewer'),
  location: z.string().min(1, 'Location is required').max(255, 'Location must be 255 characters or fewer'),
  description: z.string().max(2000).optional().nullable(),
  start_date: z.string().min(1, 'Start date is required'),
  expected_completion: z.string().min(1, 'Expected completion is required'),
  actual_completion: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;