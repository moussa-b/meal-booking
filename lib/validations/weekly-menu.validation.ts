import * as z from 'zod';
import { isMonday } from '@/lib/utils/date.utils';

/**
 * Validation schema for a day in a weekly menu
 */
const weeklyMenuDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mainDishId: z.number().int().positive('Le plat principal est requis'),
  appetizerId: z.number().int().positive().nullable().optional(),
  dessertId: z.number().int().positive().nullable().optional(),
});

/**
 * Validation schema for creating a weekly menu
 */
export const createWeeklyMenuSchema = z.object({
  weekStartDate: z.date().refine(
    (date) => isMonday(date),
    {
      message: 'La date doit être un lundi',
    }
  ),
  days: z.array(weeklyMenuDaySchema)
    .min(1, 'Au moins un jour doit être défini')
    .refine(
      (days) => {
        // Vérifier qu'il n'y a pas de doublons de dayOfWeek
        const dayOfWeeks = days.map(d => d.dayOfWeek);
        return new Set(dayOfWeeks).size === dayOfWeeks.length;
      },
      {
        message: 'Chaque jour ne peut être défini qu\'une seule fois',
      }
    ),
});

/**
 * Validation schema for updating a weekly menu
 */
export const updateWeeklyMenuSchema = z.object({
  weekStartDate: z.date()
    .refine(
      (date) => isMonday(date),
      {
        message: 'La date doit être un lundi',
      }
    )
    .optional(),
  days: z.array(weeklyMenuDaySchema)
    .min(1, 'Au moins un jour doit être défini')
    .refine(
      (days) => {
        // Vérifier qu'il n'y a pas de doublons de dayOfWeek
        const dayOfWeeks = days.map(d => d.dayOfWeek);
        return new Set(dayOfWeeks).size === dayOfWeeks.length;
      },
      {
        message: 'Chaque jour ne peut être défini qu\'une seule fois',
      }
    )
    .optional(),
});

export type CreateWeeklyMenuInput = z.infer<typeof createWeeklyMenuSchema>;
export type UpdateWeeklyMenuInput = z.infer<typeof updateWeeklyMenuSchema>;
