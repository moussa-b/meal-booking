import { describe, expect, it } from 'vitest';
import {
  createWeeklyMenu,
  deleteWeeklyMenu,
  getAllWeeklyMenus,
  getWeeklyMenuWithMealsForDate,
  getWeeklyMenuById,
  getWeeklyMenuByWeekStart,
  updateWeeklyMenu,
} from '@/lib/services/weekly-menu.service';
import { DayOfWeek } from '@/lib/utils/date.utils';
import { MealType } from '@/lib/models/meal';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestMealData, createTestWeeklyMenuData, createTestSchoolData } from '../helpers/test-data';
import { createMeal } from '@/lib/services/meal.service';
import { createSchool } from '@/lib/services/school.service';
import { getMonday, formatDateLocal } from '@/lib/utils/date.utils';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('Weekly Menu Service', () => {
  // Helper to create test meals
  async function createTestMeals() {
    const mainDish = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE, name: 'Main Dish 1' }));
    const appetizer = await createMeal(createTestMealData({ type: MealType.APPETIZER, name: 'Appetizer 1' }));
    const dessert = await createMeal(createTestMealData({ type: MealType.DESSERT, name: 'Dessert 1' }));
    return { mainDish, appetizer, dessert };
  }

  // Helper to create test school
  async function createTestSchool() {
    return await createSchool(createTestSchoolData());
  }

  describe('getAllWeeklyMenus', () => {
    it('should return empty array when no menus exist', async () => {
      const menus = await getAllWeeklyMenus();
      expect(menus).toEqual([]);
      expect(menus.length).toBe(0);
    });

    it('should return all menus ordered by weekStartDate DESC', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday1 = getMonday(new Date());
      monday1.setDate(monday1.getDate() + 7);
      const monday2 = new Date(monday1);
      monday2.setDate(monday2.getDate() + 7);

      const menu1 = await createWeeklyMenu({
        schoolId: school.id,
        weekStartDate: monday1,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const menu2 = await createWeeklyMenu({
        schoolId: school.id,
        weekStartDate: monday2,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.00 }],
      });

      const menus = await getAllWeeklyMenus();

      expect(menus.length).toBe(2);
      // Should be ordered by weekStartDate DESC (newest first)
      expect(menus[0].id).toBe(menu2.id);
      expect(menus[1].id).toBe(menu1.id);
    });

    it('should return menus with their days', async () => {
      const school = await createTestSchool();
      const { mainDish, appetizer, dessert } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        schoolId: school.id,
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, dessertId: dessert.id, price: 8.50 },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, price: 7.00 },
        ],
      });

      const created = await createWeeklyMenu(testData);
      const menus = await getAllWeeklyMenus();
      const menu = menus.find((m) => m.id === created.id);

      expect(menu).toBeDefined();
      expect(menu?.days).toBeDefined();
      expect(menu?.days?.length).toBe(2);
      expect(menu?.days?.[0].dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(menu?.days?.[0].mainDishId).toBe(mainDish.id);
      expect(menu?.days?.[0].appetizerId).toBe(appetizer.id);
      expect(menu?.days?.[0].dessertId).toBe(dessert.id);
      expect(menu?.days?.[0].price).toBe(8.50);
      expect(menu?.days?.[1].price).toBe(7.00);
    });
  });

  describe('getWeeklyMenuById', () => {
    it('should return null when menu does not exist', async () => {
      const menu = await getWeeklyMenuById(99999);
      expect(menu).toBeNull();
    });

    it('should return menu when it exists', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      });
      const created = await createWeeklyMenu(testData);

      const menu = await getWeeklyMenuById(created.id);

      expect(menu).not.toBeNull();
      expect(menu?.id).toBe(created.id);
      expect(menu?.weekStartDate).toBeInstanceOf(Date);
      expect(menu?.days).toBeDefined();
      expect(menu?.days?.length).toBe(1);
      expect(menu?.days?.[0].price).toBeDefined();
      expect(typeof menu?.days?.[0].price).toBe('number');
    });
  });

  describe('getWeeklyMenuByWeekStart', () => {
    it('should return null when menu does not exist for date', async () => {
      const school = await createTestSchool();
      const monday = getMonday(new Date());
      const menu = await getWeeklyMenuByWeekStart(monday, school.id);
      expect(menu).toBeNull();
    });

    it('should return menu when it exists for date', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);
      const testData = createTestWeeklyMenuData({
        schoolId: school.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.00 }],
      });
      const created = await createWeeklyMenu(testData);

      const menu = await getWeeklyMenuByWeekStart(monday, school.id);

      expect(menu).not.toBeNull();
      expect(menu?.id).toBe(created.id);
    });
  });

  describe('getWeeklyMenuWithMealsForDate', () => {
    it('should throw when weekStartDate is not a Monday', async () => {
      const school = await createTestSchool();
      const tuesday = getMonday(new Date());
      tuesday.setDate(tuesday.getDate() + 1);

      await expect(getWeeklyMenuWithMealsForDate(tuesday, school.id)).rejects.toThrow(
        'weekStartDate must be a Monday'
      );
    });

    it('should throw when schoolId is invalid', async () => {
      const monday = getMonday(new Date());

      await expect(getWeeklyMenuWithMealsForDate(monday, 0)).rejects.toThrow(
        'schoolId is required and must be a positive number'
      );
      await expect(getWeeklyMenuWithMealsForDate(monday, -1)).rejects.toThrow(
        'schoolId is required and must be a positive number'
      );
    });

    it('should return null when no menu exists for that week and school', async () => {
      const school = await createTestSchool();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);

      const menu = await getWeeklyMenuWithMealsForDate(monday, school.id);

      expect(menu).toBeNull();
    });

    it('should return menu with meals when menu exists for that week and school', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);
      const testData = createTestWeeklyMenuData({
        schoolId: school.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.00 }],
      });
      await createWeeklyMenu(testData);

      const menu = await getWeeklyMenuWithMealsForDate(monday, school.id);

      expect(menu).not.toBeNull();
      expect(menu?.schoolId).toBe(school.id);
      expect(menu?.weekStartDate).toBeInstanceOf(Date);
      expect(menu?.days).toBeDefined();
      expect(menu?.days?.length).toBe(1);
      expect(menu?.days?.[0].mainDish).toBeDefined();
      expect(menu?.days?.[0].mainDish?.id).toBe(mainDish.id);
    });
  });

  describe('createWeeklyMenu', () => {
    it('should create a new menu and return it', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      });

      const menu = await createWeeklyMenu(testData);

      expect(menu.id).toBeGreaterThan(0);
      expect(menu.weekStartDate).toBeInstanceOf(Date);
      expect(menu.days).toBeDefined();
      expect(menu.days?.length).toBe(1);
      expect(menu.days?.[0].price).toBeDefined();
      expect(menu.weekNumber).toBeDefined();
      expect(menu.year).toBeDefined();
    });

    it('should create menu with multiple days', async () => {
      const school = await createTestSchool();
      const { mainDish, appetizer, dessert } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        schoolId: school.id,
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, price: 9.50 },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, dessertId: dessert.id, price: 8.00 },
          { dayOfWeek: DayOfWeek.WEDNESDAY, mainDishId: mainDish.id, price: 7.50 },
          { dayOfWeek: DayOfWeek.THURSDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, dessertId: dessert.id, price: 10.00 },
        ],
      });

      const menu = await createWeeklyMenu(testData);

      expect(menu.days?.length).toBe(4);
      expect(menu.days?.[0].dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(menu.days?.[0].appetizerId).toBe(appetizer.id);
      expect(menu.days?.[0].price).toBe(9.50);
      expect(menu.days?.[1].dayOfWeek).toBe(DayOfWeek.TUESDAY);
      expect(menu.days?.[1].dessertId).toBe(dessert.id);
      expect(menu.days?.[1].price).toBe(8.00);
      expect(menu.days?.[2].dayOfWeek).toBe(DayOfWeek.WEDNESDAY);
      expect(menu.days?.[2].appetizerId).toBeNull();
      expect(menu.days?.[2].dessertId).toBeNull();
      expect(menu.days?.[2].price).toBe(7.50);
      expect(menu.days?.[3].price).toBe(10.00);
    });

    it('should throw error when menu exists for same school and date', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);

      const testData1 = createTestWeeklyMenuData({
        schoolId: school.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      });

      await createWeeklyMenu(testData1);

      // Try to create another menu with the same school and date
      const testData2 = createTestWeeklyMenuData({
        schoolId: school.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.00 }],
      });

      await expect(createWeeklyMenu(testData2)).rejects.toThrow('Un menu existe déjà pour cette école et cette date');
    });

    it('should allow creating menu for same date but different school', async () => {
      const school1 = await createTestSchool();
      const school2 = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);

      const testData1 = createTestWeeklyMenuData({
        schoolId: school1.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      });

      const menu1 = await createWeeklyMenu(testData1);

      // Create menu for same date but different school - should succeed
      const testData2 = createTestWeeklyMenuData({
        schoolId: school2.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.00 }],
      });

      const menu2 = await createWeeklyMenu(testData2);

      expect(menu1.id).not.toBe(menu2.id);
      expect(menu1.schoolId).toBe(school1.id);
      expect(menu2.schoolId).toBe(school2.id);
    });
  });

  describe('updateWeeklyMenu', () => {
    it('should update menu weekStartDate', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      const newMonday = new Date(created.weekStartDate);
      newMonday.setDate(newMonday.getDate() + 14);

      const updated = await updateWeeklyMenu(created.id, {
        weekStartDate: newMonday,
      });

      expect(updated.id).toBe(created.id);
      expect(formatDateLocal(updated.weekStartDate)).toBe(formatDateLocal(newMonday));
      expect(updated.days?.length).toBe(created.days?.length);
    });

    it('should update menu days', async () => {
      const school = await createTestSchool();
      const { mainDish, appetizer } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      const updated = await updateWeeklyMenu(created.id, {
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, price: 9.00 },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, price: 8.50 },
        ],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.days?.length).toBe(2);
      expect(updated.days?.[0].appetizerId).toBe(appetizer.id);
      expect(updated.days?.[0].price).toBe(9.00);
      expect(updated.days?.[1].price).toBe(8.50);
    });

    it('should update both weekStartDate and days', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      const newMonday = new Date(created.weekStartDate);
      newMonday.setDate(newMonday.getDate() + 14);

      const updated = await updateWeeklyMenu(created.id, {
        weekStartDate: newMonday,
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.50 },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, price: 7.00 },
        ],
      });

      expect(formatDateLocal(updated.weekStartDate)).toBe(formatDateLocal(newMonday));
      expect(updated.days?.length).toBe(2);
      expect(updated.days?.[0].price).toBe(6.50);
      expect(updated.days?.[1].price).toBe(7.00);
    });

    it('should throw error when menu does not exist', async () => {
      await expect(
        updateWeeklyMenu(99999, { weekStartDate: getMonday(new Date()) })
      ).rejects.toThrow('Weekly menu not found');
    });

    it('should throw error when updating to existing school+date combination', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday1 = getMonday(new Date());
      monday1.setDate(monday1.getDate() + 7);
      const monday2 = new Date(monday1);
      monday2.setDate(monday2.getDate() + 7);

      // Create two menus with different dates for the same school
      const menu1 = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        weekStartDate: monday1,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      const menu2 = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        weekStartDate: monday2,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 6.00 }],
      }));

      // Try to update menu1 with menu2's date - should fail
      await expect(
        updateWeeklyMenu(menu1.id, { weekStartDate: monday2 })
      ).rejects.toThrow('Un menu existe déjà pour cette école et cette date');
    });

    it('should allow update when school+date combination is unchanged', async () => {
      const school = await createTestSchool();
      const { mainDish, appetizer } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      // Update only days (without changing schoolId or weekStartDate) - should succeed
      const updated = await updateWeeklyMenu(created.id, {
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, price: 9.00 },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, price: 8.50 },
        ],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.schoolId).toBe(created.schoolId);
      expect(formatDateLocal(updated.weekStartDate)).toBe(formatDateLocal(created.weekStartDate));
      expect(updated.days?.length).toBe(2);
    });

    it('should allow updating schoolId to a different school with same date if that combination does not exist', async () => {
      const school1 = await createTestSchool();
      const school2 = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);

      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school1.id,
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      // Update schoolId to school2 - should succeed since school2 doesn't have a menu for this date
      const updated = await updateWeeklyMenu(created.id, {
        schoolId: school2.id,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.schoolId).toBe(school2.id);
    });
  });

  describe('deleteWeeklyMenu', () => {
    it('should delete an existing menu', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 }],
      }));

      await deleteWeeklyMenu(created.id);

      const menu = await getWeeklyMenuById(created.id);
      expect(menu).toBeNull();
    });

    it('should throw error when menu does not exist', async () => {
      await expect(deleteWeeklyMenu(99999)).rejects.toThrow('Weekly menu not found');
    });

    it('should cascade delete menu days', async () => {
      const school = await createTestSchool();
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        schoolId: school.id,
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, price: 5.50 },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, price: 6.00 },
        ],
      }));

      await deleteWeeklyMenu(created.id);

      const menu = await getWeeklyMenuById(created.id);
      expect(menu).toBeNull();
    });
  });
});
