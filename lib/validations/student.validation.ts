import * as z from 'zod';

/**
 * Validation schema for updating a student
 */
export const updateStudentSchema = z.object({
  lastName: z.string().min(1, 'Le nom est requis').optional(),
  firstName: z.string().min(1, 'Le prénom est requis').optional(),
  class: z.string().min(1, 'La classe est requise').optional(),
  feedingRegime: z.string().optional().nullable(),
  parentEmail: z.string().email('Email invalide').optional().nullable(),
});

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
