import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(64, 'Display name must not exceed 64 characters'),
  avatar_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
