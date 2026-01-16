import * as z from 'zod';

/**
 * Validation schema for creating a school
 * Note: code is auto-generated on the server side, so it's not in the schema
 */
export const createSchoolSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
});

/**
 * Validation schema for updating a school
 * Note: code is readonly and cannot be updated
 */
export const updateSchoolSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  description: z.string().optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
