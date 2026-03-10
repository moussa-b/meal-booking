import { Meal } from './meal';

/**
 * WeeklyMenu model interface
 * Represents a weekly menu starting on a Monday
 */
export interface WeeklyMenu {
  id: number;
  created: Date;
  organizationId: number; // Référence à l'établissement
  weekStartDate: Date; // Date du lundi de début de semaine
  weekNumber?: number; // Numéro de semaine dans l'année
  year?: number; // Année
  days?: WeeklyMenuDay[]; // Relation optionnelle pour les requêtes avec JOIN
  orderCount?: number; // OPTIONAL - Nombre de commandes pour cette semaine
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

/**
 * WeeklyMenuDayInput interface
 * Represents the input structure for a day in a weekly menu form
 * Used in create/update operations (without id and weeklyMenuId)
 */
export interface WeeklyMenuDayInput {
  dayOfWeek: number; // 0 = Lundi, 1 = Mardi, 2 = Mercredi, etc.
  mainDishId: number; // REQUIRED - Référence à meals.id
  appetizerId?: number | null; // OPTIONAL - Référence à meals.id
  dessertId?: number | null; // OPTIONAL - Référence à meals.id
  price: number | string; // REQUIRED - Prix du menu du jour (peut être string depuis le formulaire)
}
