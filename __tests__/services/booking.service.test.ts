import { describe, expect, it } from 'vitest';
import { createBooking, getBookingById, getBookingsByEmail, } from '@/lib/services/booking.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestMealData, createTestSchoolData, createTestWeeklyMenuData } from '../helpers/test-data';
import { createSchool } from '@/lib/services/school.service';
import { createMeal } from '@/lib/services/meal.service';
import { createWeeklyMenu } from '@/lib/services/weekly-menu.service';
import { MealType } from '@/lib/models/meal';
import { DayOfWeek } from '@/lib/models/weekly-menu';
import type { BookingSubmission } from '@/lib/models/booking-submission';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('Booking Service', () => {
  // Helper function to create test booking data
  async function createTestBookingData(overrides?: {
    email?: string;
    schoolId?: number;
    menuId?: number;
    students?: Array<{
      lastName: string;
      firstName: string;
      class: string;
      feedingRegime?: string | null | undefined;
    }>;
    menuSelections?: Record<string, number[]>;
    saveChildrenInfo?: boolean;
  }): Promise<BookingSubmission> {
    // Create school if not provided
    let schoolId = overrides?.schoolId;
    if (!schoolId) {
      const school = await createSchool(createTestSchoolData());
      schoolId = school.id;
    }

    // Create meals
    const mainDish = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE }));
    const appetizer = await createMeal(createTestMealData({ type: MealType.APPETIZER }));
    const dessert = await createMeal(createTestMealData({ type: MealType.DESSERT }));

    // Create weekly menu if not provided
    let menuId = overrides?.menuId;
    if (!menuId) {
      const menu = await createWeeklyMenu(
        createTestWeeklyMenuData({
          schoolId,
          days: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              mainDishId: mainDish.id,
              appetizerId: appetizer.id,
              dessertId: dessert.id,
              price: 5.5,
            },
            {
              dayOfWeek: DayOfWeek.TUESDAY,
              mainDishId: mainDish.id,
              appetizerId: null,
              dessertId: dessert.id,
              price: 4.5,
            },
          ],
        })
      );
      menuId = menu.id;
    }

    // Get menu days for selections
    const { getWeeklyMenuById } = await import('@/lib/services/weekly-menu.service');
    const menu = await getWeeklyMenuById(menuId!);
    const menuDays = menu?.days || [];
    const mondayDay = menuDays.find((d) => d.dayOfWeek === DayOfWeek.MONDAY);
    const tuesdayDay = menuDays.find((d) => d.dayOfWeek === DayOfWeek.TUESDAY);

    // Default students
    const students =
      overrides?.students ||
      [
        {
          lastName: 'Doe',
          firstName: 'John',
          class: 'CM1',
          feedingRegime: null,
        },
      ];

    // Default menu selections
    const menuSelections =
      overrides?.menuSelections ||
      (mondayDay
        ? {
            [`${students[0].firstName}-${students[0].lastName}-0`]: [mondayDay.id],
          }
        : {});

    return {
      schoolId: schoolId!,
      menuId: menuId!,
      email: overrides?.email || `test${Date.now()}@example.com`,
      students: students.map((student) => ({
        id: 0, // Not used in submission
        created: new Date(),
        ...student,
      })),
      menuSelections,
      saveChildrenInfo: overrides?.saveChildrenInfo ?? false,
    };
  }

  describe('createBooking', () => {
    it('should create a booking with saveChildrenInfo = false', async () => {
      const bookingData = await createTestBookingData({ saveChildrenInfo: false });

      const booking = await createBooking(bookingData, false);

      expect(booking.id).toBeGreaterThan(0);
      expect(booking.email).toBe(bookingData.email);
      expect(booking.schoolId).toBe(bookingData.schoolId);
      expect(booking.menuId).toBe(bookingData.menuId);
      expect(booking.students).toBeDefined();
      expect(booking.students?.length).toBe(bookingData.students.length);
      expect(booking.students?.[0].studentId).toBeNull(); // Should not have studentId
    });

    it('should create a booking with saveChildrenInfo = true and create students', async () => {
      const bookingData = await createTestBookingData({ saveChildrenInfo: true });

      const booking = await createBooking(bookingData, true);

      expect(booking.id).toBeGreaterThan(0);
      expect(booking.students).toBeDefined();
      expect(booking.students?.length).toBe(bookingData.students.length);
      expect(booking.students?.[0].studentId).not.toBeNull(); // Should have studentId

      // Verify student was created
      const { getStudentsByParentEmail } = await import('@/lib/services/student.service');
      const students = await getStudentsByParentEmail(bookingData.email);
      expect(students.length).toBeGreaterThan(0);
      expect(students[0].parentEmail).toBe(bookingData.email);
    });

    it('should create booking with multiple students', async () => {
      const bookingData = await createTestBookingData({
        students: [
          {
            lastName: 'Doe',
            firstName: 'John',
            class: 'CM1',
            feedingRegime: null,
          },
          {
            lastName: 'Doe',
            firstName: 'Jane',
            class: 'CE2',
            feedingRegime: 'Végétarien',
          },
        ],
      });

      const booking = await createBooking(bookingData, false);

      expect(booking.students?.length).toBe(2);
      expect(booking.students?.[0].firstName).toBe('John');
      expect(booking.students?.[1].firstName).toBe('Jane');
    });

    it('should create booking with menu selections', async () => {
      const bookingData = await createTestBookingData();
      const booking = await createBooking(bookingData, false);

      expect(booking.students?.[0].menuSelections).toBeDefined();
      expect(booking.students?.[0].menuSelections?.length).toBeGreaterThan(0);
    });

    it('should throw error when school does not exist', async () => {
      // Create a valid school and menu first
      const school = await createSchool(createTestSchoolData());
      const mainDish = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE }));
      const appetizer = await createMeal(createTestMealData({ type: MealType.APPETIZER }));
      const dessert = await createMeal(createTestMealData({ type: MealType.DESSERT }));
      const menu = await createWeeklyMenu(
        createTestWeeklyMenuData({
          schoolId: school.id,
          days: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              mainDishId: mainDish.id,
              appetizerId: appetizer.id,
              dessertId: dessert.id,
              price: 5.5,
            },
          ],
        })
      );

      // Test with invalid schoolId but valid menuId
      const bookingData = await createTestBookingData({
        schoolId: 99999,
        menuId: menu.id,
      });

      await expect(createBooking(bookingData, false)).rejects.toThrow('School not found');
    });

    it('should throw error when menu does not exist', async () => {
      const bookingData = await createTestBookingData({ menuId: 99999 });

      await expect(createBooking(bookingData, false)).rejects.toThrow('Weekly menu not found');
    });

    it('should throw error when menu does not belong to school', async () => {
      const school1 = await createSchool(createTestSchoolData());
      const school2 = await createSchool(createTestSchoolData());

      const mainDish = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE }));
      const menu = await createWeeklyMenu(
        createTestWeeklyMenuData({
          schoolId: school1.id,
          days: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              mainDishId: mainDish.id,
              appetizerId: null,
              dessertId: null,
              price: 5.0,
            },
          ],
        })
      );

      const bookingData = await createTestBookingData({
        schoolId: school2.id,
        menuId: menu.id,
      });

      await expect(createBooking(bookingData, false)).rejects.toThrow(
        'Menu does not belong to the specified school'
      );
    });

    it('should throw error when menu day does not belong to menu', async () => {
      const bookingData = await createTestBookingData();
      // Use invalid menu day ID
      bookingData.menuSelections = {
        [`${bookingData.students[0].firstName}-${bookingData.students[0].lastName}-0`]: [99999],
      };

      await expect(createBooking(bookingData, false)).rejects.toThrow(
        'does not belong to menu'
      );
    });
  });

  describe('getBookingById', () => {
    it('should return null when booking does not exist', async () => {
      const booking = await getBookingById(99999);
      expect(booking).toBeNull();
    });

    it('should return booking with all details', async () => {
      const bookingData = await createTestBookingData();
      const created = await createBooking(bookingData, false);

      const booking = await getBookingById(created.id);

      expect(booking).not.toBeNull();
      expect(booking?.id).toBe(created.id);
      expect(booking?.email).toBe(bookingData.email);
      expect(booking?.schoolId).toBe(bookingData.schoolId);
      expect(booking?.menuId).toBe(bookingData.menuId);
      expect(booking?.students).toBeDefined();
      expect(booking?.students?.length).toBe(bookingData.students.length);
    });

    it('should return booking with menu selections', async () => {
      const bookingData = await createTestBookingData();
      const created = await createBooking(bookingData, false);

      const booking = await getBookingById(created.id);

      expect(booking?.students?.[0].menuSelections).toBeDefined();
      expect(booking?.students?.[0].menuSelections?.length).toBeGreaterThan(0);
    });
  });

  describe('getBookingsByEmail', () => {
    it('should return empty array when no bookings exist for email', async () => {
      const bookings = await getBookingsByEmail('nonexistent@example.com');
      expect(bookings).toEqual([]);
    });

    it('should return bookings for a specific email', async () => {
      const email = `test${Date.now()}@example.com`;
      const bookingData1 = await createTestBookingData({ email });
      const bookingData2 = await createTestBookingData({ email });
      // Create booking with different email
      await createBooking(await createTestBookingData({ email: 'other@example.com' }), false);

      const booking1 = await createBooking(bookingData1, false);
      const booking2 = await createBooking(bookingData2, false);

      const bookings = await getBookingsByEmail(email);

      expect(bookings.length).toBe(2);
      const bookingIds = bookings.map((b) => b.id);
      expect(bookingIds).toContain(booking1.id);
      expect(bookingIds).toContain(booking2.id);
    });

    it('should return bookings ordered by created DESC', async () => {
      const email = `test${Date.now()}@example.com`;
      const bookingData1 = await createTestBookingData({ email });
      const booking1 = await createBooking(bookingData1, false);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const bookingData2 = await createTestBookingData({ email });
      const booking2 = await createBooking(bookingData2, false);

      const bookings = await getBookingsByEmail(email);

      expect(bookings.length).toBe(2);
      // Should be ordered by created DESC (newest first)
      expect(bookings[0].id).toBe(booking2.id);
      expect(bookings[1].id).toBe(booking1.id);
    });
  });
});
