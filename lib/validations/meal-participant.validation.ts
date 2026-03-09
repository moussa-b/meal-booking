import * as z from 'zod';
import { ORGANIZATION_TYPES } from '@/lib/models/organization';

/**
 * Validation schema for updating a meal participant
 */
export const updateMealParticipantSchema = z.object({
  lastName: z.string().min(1, 'Le nom est requis').optional(),
  firstName: z.string().min(1, 'Le prénom est requis').optional(),
  class: z.string().min(1, 'La classe est requise').optional(),
  type: z.enum(ORGANIZATION_TYPES).optional(),
  feedingRegime: z.string().optional().nullable(),
  email: z.email('Email invalide').optional().nullable(),
});

export type UpdateMealParticipantInput = z.infer<typeof updateMealParticipantSchema>;
