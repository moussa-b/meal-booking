import { describe, expect, it } from 'vitest';
import {
  createWeeklyMenu,
  deleteWeeklyMenu,
  getAllWeeklyMenus,
  getWeeklyMenuById,
  getWeeklyMenuByWeekStart,
  updateWeeklyMenu,
} from '@/lib/services/weekly-menu.service';
import { DayOfWeek } from '@/lib/models/weekly-menu';
import { MealType } from '@/lib/models/meal';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestMealData, createTestWeeklyMenuData } from '../helpers/test-data';
import { createMeal } from '@/lib/services/meal.service';
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

  describe('getAllWeeklyMenus', () => {
    it('should return empty array when no menus exist', async () => {
      const menus = await getAllWeeklyMenus();
      expect(menus).toEqual([]);
      expect(menus.length).toBe(0);
    });

    it('should return all menus ordered by weekStartDate DESC', async () => {
      const { mainDish } = await createTestMeals();
      const monday1 = getMonday(new Date());
      monday1.setDate(monday1.getDate() + 7);
      const monday2 = new Date(monday1);
      monday2.setDate(monday2.getDate() + 7);

      const menu1 = await createWeeklyMenu({
        weekStartDate: monday1,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const menu2 = await createWeeklyMenu({
        weekStartDate: monday2,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      });

      const menus = await getAllWeeklyMenus();

      expect(menus.length).toBe(2);
      // Should be ordered by weekStartDate DESC (newest first)
      expect(menus[0].id).toBe(menu2.id);
      expect(menus[1].id).toBe(menu1.id);
    });

    it('should return menus with their days', async () => {
      const { mainDish, appetizer, dessert } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, dessertId: dessert.id },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id },
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
    });
  });

  describe('getWeeklyMenuById', () => {
    it('should return null when menu does not exist', async () => {
      const menu = await getWeeklyMenuById(99999);
      expect(menu).toBeNull();
    });

    it('should return menu when it exists', async () => {
      const { mainDish } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      });
      const created = await createWeeklyMenu(testData);

      const menu = await getWeeklyMenuById(created.id);

      expect(menu).not.toBeNull();
      expect(menu?.id).toBe(created.id);
      expect(menu?.weekStartDate).toBeInstanceOf(Date);
      expect(menu?.days).toBeDefined();
      expect(menu?.days?.length).toBe(1);
    });
  });

  describe('getWeeklyMenuByWeekStart', () => {
    it('should return null when menu does not exist for date', async () => {
      const monday = getMonday(new Date());
      const menu = await getWeeklyMenuByWeekStart(monday);
      expect(menu).toBeNull();
    });

    it('should return menu when it exists for date', async () => {
      const { mainDish } = await createTestMeals();
      const monday = getMonday(new Date());
      monday.setDate(monday.getDate() + 7);
      const testData = createTestWeeklyMenuData({
        weekStartDate: monday,
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      });
      const created = await createWeeklyMenu(testData);

      const menu = await getWeeklyMenuByWeekStart(monday);

      expect(menu).not.toBeNull();
      expect(menu?.id).toBe(created.id);
    });
  });

  describe('createWeeklyMenu', () => {
    it('should create a new menu and return it', async () => {
      const { mainDish } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      });

      const menu = await createWeeklyMenu(testData);

      expect(menu.id).toBeGreaterThan(0);
      expect(menu.weekStartDate).toBeInstanceOf(Date);
      expect(menu.days).toBeDefined();
      expect(menu.days?.length).toBe(1);
      expect(menu.weekNumber).toBeDefined();
      expect(menu.year).toBeDefined();
    });

    it('should create menu with multiple days', async () => {
      const { mainDish, appetizer, dessert } = await createTestMeals();
      const testData = createTestWeeklyMenuData({
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id, dessertId: dessert.id },
          { dayOfWeek: DayOfWeek.WEDNESDAY, mainDishId: mainDish.id },
          { dayOfWeek: DayOfWeek.THURSDAY, mainDishId: mainDish.id, appetizerId: appetizer.id, dessertId: dessert.id },
        ],
      });

      const menu = await createWeeklyMenu(testData);

      expect(menu.days?.length).toBe(4);
      expect(menu.days?.[0].dayOfWeek).toBe(DayOfWeek.MONDAY);
      expect(menu.days?.[0].appetizerId).toBe(appetizer.id);
      expect(menu.days?.[1].dayOfWeek).toBe(DayOfWeek.TUESDAY);
      expect(menu.days?.[1].dessertId).toBe(dessert.id);
      expect(menu.days?.[2].dayOfWeek).toBe(DayOfWeek.WEDNESDAY);
      expect(menu.days?.[2].appetizerId).toBeNull();
      expect(menu.days?.[2].dessertId).toBeNull();
    });
  });

  describe('updateWeeklyMenu', () => {
    it('should update menu weekStartDate', async () => {
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
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
      const { mainDish, appetizer } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      }));

      const updated = await updateWeeklyMenu(created.id, {
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id, appetizerId: appetizer.id },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id },
        ],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.days?.length).toBe(2);
      expect(updated.days?.[0].appetizerId).toBe(appetizer.id);
    });

    it('should update both weekStartDate and days', async () => {
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      }));

      const newMonday = new Date(created.weekStartDate);
      newMonday.setDate(newMonday.getDate() + 14);

      const updated = await updateWeeklyMenu(created.id, {
        weekStartDate: newMonday,
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id },
        ],
      });

      expect(formatDateLocal(updated.weekStartDate)).toBe(formatDateLocal(newMonday));
      expect(updated.days?.length).toBe(2);
    });

    it('should throw error when menu does not exist', async () => {
      await expect(
        updateWeeklyMenu(99999, { weekStartDate: getMonday(new Date()) })
      ).rejects.toThrow('Weekly menu not found');
    });
  });

  describe('deleteWeeklyMenu', () => {
    it('should delete an existing menu', async () => {
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        days: [{ dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id }],
      }));

      await deleteWeeklyMenu(created.id);

      const menu = await getWeeklyMenuById(created.id);
      expect(menu).toBeNull();
    });

    it('should throw error when menu does not exist', async () => {
      await expect(deleteWeeklyMenu(99999)).rejects.toThrow('Weekly menu not found');
    });

    it('should cascade delete menu days', async () => {
      const { mainDish } = await createTestMeals();
      const created = await createWeeklyMenu(createTestWeeklyMenuData({
        days: [
          { dayOfWeek: DayOfWeek.MONDAY, mainDishId: mainDish.id },
          { dayOfWeek: DayOfWeek.TUESDAY, mainDishId: mainDish.id },
        ],
      }));

      await deleteWeeklyMenu(created.id);

      const menu = await getWeeklyMenuById(created.id);
      expect(menu).toBeNull();
    });
  });
});
