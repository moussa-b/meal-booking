import { MealType } from '@/lib/models/meal';

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
