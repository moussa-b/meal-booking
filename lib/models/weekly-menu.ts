import { Meal } from './meal';

/**
 * Day of week enum
 * Represents the days of the week (0 = Monday, 6 = Sunday)
 */
export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

/**
 * WeeklyMenu model interface
 * Represents a weekly menu starting on a Monday
 */
export interface WeeklyMenu {
  id: number;
  created: Date;
  weekStartDate: Date; // Date du lundi de début de semaine
  weekNumber?: number; // Numéro de semaine dans l'année
  year?: number; // Année
  days?: WeeklyMenuDay[]; // Relation optionnelle pour les requêtes avec JOIN
}

/**
 * WeeklyMenuDay model interface
 * Represents the meal composition for a specific day of the week
 * within a weekly menu
 */
export interface WeeklyMenuDay {
  id: number;
  weeklyMenuId: number;
  dayOfWeek: number; // 0 = Lundi, 1 = Mardi, 2 = Mercredi, etc.
  mainDishId: number; // REQUIRED - Référence à meals.id
  appetizerId?: number | null; // OPTIONAL - Référence à meals.id
  dessertId?: number | null; // OPTIONAL - Référence à meals.id
  price: number; // REQUIRED - Prix du menu du jour

  // Relations optionnelles pour les requêtes avec JOIN
  mainDish?: Meal;
  appetizer?: Meal | null;
  dessert?: Meal | null;
  weeklyMenu?: WeeklyMenu;
}
