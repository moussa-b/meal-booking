import { MealType } from '@/lib/models/meal';
import { DayOfWeek } from '@/lib/utils/date.utils';
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
  schoolId?: number;
  weekStartDate?: Date;
  days?: Array<{
    dayOfWeek: number;
    mainDishId: number;
    appetizerId?: number | null;
    dessertId?: number | null;
    price: number;
  }>;
}) {
  // Get next Monday if no date provided
  const defaultDate = getMonday(new Date());
  if (defaultDate <= new Date()) {
    // If Monday is today or in the past, get next Monday
    defaultDate.setDate(defaultDate.getDate() + 7);
  }

  return {
    schoolId: overrides?.schoolId ?? 1, // Default to schoolId 1, should be provided in tests
    weekStartDate: overrides?.weekStartDate || defaultDate,
    days: overrides?.days || [
      {
        dayOfWeek: DayOfWeek.MONDAY,
        mainDishId: 1,
        appetizerId: null,
        dessertId: null,
        price: 0.0,
      },
    ],
  };
}

/**
 * Test data factory for creating student test data
 */
export function createTestStudentData(overrides?: {
  lastName?: string;
  firstName?: string;
  class?: string;
  feedingRegime?: string | null;
  parentEmail?: string | null;
}) {
  return {
    lastName: overrides?.lastName || `Doe${Date.now()}`,
    firstName: overrides?.firstName || `John${Date.now()}`,
    class: overrides?.class || 'CM1',
    feedingRegime: overrides?.feedingRegime !== undefined ? overrides.feedingRegime : null,
    parentEmail: overrides?.parentEmail !== undefined ? overrides.parentEmail : `test${Date.now()}@example.com`,
  };
}

/**
 * Test data factory for creating user test data
 */
export function createTestUserData(overrides?: {
  username?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
}) {
  const timestamp = Date.now();

  return {
    username: overrides?.username ?? `testuser${timestamp}`,
    firstname: overrides?.firstname ?? 'Test',
    lastname: overrides?.lastname ?? 'User',
    email: overrides?.email ?? `test${timestamp}@example.com`,
    // Use a deterministic default hashed password value; tests can override as needed
    password: overrides?.password ?? 'hashed-password',
  };
}
