import * as z from 'zod';

/**
 * Validation schema for creating a school
 */
export const createSchoolSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().min(1, 'Le code est requis'),
  description: z.string().optional(),
});

/**
 * Validation schema for updating a school
 */
export const updateSchoolSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  code: z.string().min(1, 'Le code est requis').optional(),
  description: z.string().optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
