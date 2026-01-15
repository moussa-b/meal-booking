/**
 * Meal type enum
 * Represents the category of a meal item
 */
export enum MealType {
  APPETIZER = 'entrée',
  MAIN_COURSE = 'plat principal',
  DESSERT = 'dessert',
}

/**
 * Meal model interface
 * Represents a meal item with a name, type, and description
 */
export interface Meal {
  id: number;
  created: Date;
  name: string;
  type: MealType;
  description: string;
}
