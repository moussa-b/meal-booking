import * as z from 'zod';
import { ORGANIZATION_TYPES } from '@/lib/models/organization';

const menuDayOfWeekArray = z
  .array(z.number().int().min(0).max(6))
  .refine((arr) => new Set(arr).size === arr.length, 'Les jours doivent être uniques');

/**
 * Validation schema for creating an organization
 * Note: code is auto-generated on the server side, so it's not in the schema
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(ORGANIZATION_TYPES, 'Le type est requis'),
  description: z.string().optional(),
  payLaterEnabled: z.boolean().optional(),
  menuDayOfWeek: menuDayOfWeekArray.optional(),
});

/**
 * Validation schema for updating an organization
 * Note: code is readonly and cannot be updated
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  type: z.enum(ORGANIZATION_TYPES).optional(),
  description: z.string().optional(),
  payLaterEnabled: z.boolean().optional(),
  menuDayOfWeek: menuDayOfWeekArray.optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
