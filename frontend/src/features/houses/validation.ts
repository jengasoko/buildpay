import { z } from 'zod';

export const houseFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or fewer'),
  bedrooms: z.number().int('Must be a whole number').min(0),
  bathrooms: z.number().int('Must be a whole number').min(0),
  area_sqft: z.number().min(0),
  location: z.string().min(1, 'Location is required').max(255, 'Location must be 255 characters or fewer'),
  rent_price: z.number().positive('Rent price must be greater than 0'),
  price: z.number().min(0),
  image_url: z.string().optional(),
  available: z.boolean(),
  project_id: z.string().optional(),
});

export type HouseFormData = z.infer<typeof houseFormSchema>;