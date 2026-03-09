import * as z from 'zod';
import { isMonday } from '@/lib/utils/date.utils';

/**
 * Helper function to validate if a date is Monday with detailed logging
 */
function validateMonday(date: Date, context: string): boolean {
  const result = isMonday(date);
  const dayOfWeek = date.getDay();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  console.log(`[${context}] Validation lundi:`);
  console.log(`  - Date reçue: ${date.toISOString()}`);
  console.log(`  - Date locale: ${date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
  console.log(`  - Jour de la semaine (getDay()): ${dayOfWeek} (${dayNames[dayOfWeek]})`);
  console.log(`  - Résultat isMonday(): ${result}`);
  console.log(`  - Timestamp: ${date.getTime()}`);
  console.log(`  - Timezone offset: ${date.getTimezoneOffset()} minutes`);

  return result;
}

/**
 * Validation schema for a day in a weekly menu
 */
const weeklyMenuDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mainDishId: z.number().int().positive('Le plat principal est requis'),
  appetizerId: z.number().int().positive().nullable().optional(),
  dessertId: z.number().int().positive().nullable().optional(),
  price: z.union([
    z.string().min(1, 'Le prix est requis').refine(
      (val) => {
        const trimmed = val.trim();
        if (trimmed === '') return false;
        if (!/^[\d]*\.?[\d]*$/.test(trimmed)) return false;
        const num = parseFloat(trimmed);
        return !isNaN(num) && num >= 0;
      },
      {
        message: 'Le prix doit être un nombre positif ou zéro',
      }
    ),
    z.number().nonnegative('Le prix doit être un nombre positif ou zéro')
  ]),
});

/**
 * Base schema for weekly menu days
 */
const baseWeeklyMenuSchema = {
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
};

/**
 * Validation schema for creating a weekly menu (accepts string | Date)
 * Can be used both in forms and server actions thanks to z.coerce.date()
 */
export const createWeeklyMenuSchema = z.object({
  schoolId: z.number().int().positive('L\'établissement est requis'),
  weekStartDate: z.coerce.date().refine(
    (date) => validateMonday(date, 'createWeeklyMenuSchema'),
    {
      message: 'La date doit être un lundi',
    }
  ),
  ...baseWeeklyMenuSchema,
});

/**
 * Validation schema for updating a weekly menu (accepts string | Date)
 * Can be used both in forms and server actions thanks to z.coerce.date()
 */
export const updateWeeklyMenuSchema = z.object({
  schoolId: z.number().int().positive('L\'établissement est requis').optional(),
  weekStartDate: z.coerce.date()
    .refine(
      (date) => validateMonday(date, 'updateWeeklyMenuSchema'),
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
