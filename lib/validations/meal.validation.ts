import * as z from 'zod';
import { MealType } from '@/lib/models/meal';

/**
 * Validation schema for creating a meal
 */
export const createMealSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.nativeEnum(MealType, {
    message: 'Le type doit être entrée, plat principal ou dessert',
  }),
  description: z.string().min(1, 'La description est requise'),
});

/**
 * Validation schema for updating a meal
 */
export const updateMealSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').optional(),
  type: z.nativeEnum(MealType, {
    message: 'Le type doit être entrée, plat principal ou dessert',
  }).optional(),
  description: z.string().min(1, 'La description est requise').optional(),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
