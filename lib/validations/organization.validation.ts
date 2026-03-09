import * as z from 'zod';
import { ORGANIZATION_TYPES } from '@/lib/models/organization';

/**
 * Validation schema for creating an organization
 * Note: code is auto-generated on the server side, so it's not in the schema
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(ORGANIZATION_TYPES, 'Le type est requis'),
  description: z.string().optional(),
});

/**
 * Validation schema for updating an organization
 * Note: code is readonly and cannot be updated
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  type: z.enum(ORGANIZATION_TYPES).optional(),
  description: z.string().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
