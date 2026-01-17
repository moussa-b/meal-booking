import { MealType } from '@/lib/models/meal';
import { DayOfWeek } from '@/lib/models/weekly-menu';
import { getMonday } from '@/lib/utils/date.utils';

/**
 * Test data factory for creating school test data
 */
export function createTestSchoolData(overrides?: {
  name?: string;
  code?: string;
  description?: string;
}) {
  return {
    name: overrides?.name || `Test School ${Date.now()}`,
    code: overrides?.code || `TEST${Date.now()}`,
    description: overrides?.description || 'Test school description',
  };
}

/**
 * Test data factory for creating meal test data
 */
export function createTestMealData(overrides?: {
  name?: string;
  type?: MealType;
  description?: string;
}) {
  return {
    name: overrides?.name || `Test Meal ${Date.now()}`,
    type: overrides?.type || MealType.MAIN_COURSE,
    description: overrides?.description || `Test meal description ${Date.now()}`,
  };
}

/**
 * Test data factory for creating weekly menu test data
 */
export function createTestWeeklyMenuData(overrides?: {
  weekStartDate?: Date;
  days?: Array<{
    dayOfWeek: number;
    mainDishId: number;
    appetizerId?: number | null;
    dessertId?: number | null;
  }>;
}) {
  // Get next Monday if no date provided
  const defaultDate = getMonday(new Date());
  if (defaultDate <= new Date()) {
    // If Monday is today or in the past, get next Monday
    defaultDate.setDate(defaultDate.getDate() + 7);
  }

  return {
    weekStartDate: overrides?.weekStartDate || defaultDate,
    days: overrides?.days || [
      {
        dayOfWeek: DayOfWeek.MONDAY,
        mainDishId: 1,
        appetizerId: null,
        dessertId: null,
      },
    ],
  };
}
