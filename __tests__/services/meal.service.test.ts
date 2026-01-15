import { describe, expect, it } from 'vitest';
import { createMeal, deleteMeal, getAllMeals, getMealById, updateMeal, } from '@/lib/services/meal.service';
import { MealType } from '@/lib/models/meal';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestMealData } from '../helpers/test-data';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('Meal Service', () => {
  describe('getAllMeals', () => {
    it('should return empty array when no meals exist', async () => {
      const meals = await getAllMeals();
      expect(meals).toEqual([]);
      expect(meals.length).toBe(0);
    });

    it('should return all meals ordered by created DESC', async () => {
      // Create test meals with 1 second delay between each to ensure distinct timestamps
      const meal1 = await createMeal(createTestMealData({ name: 'Meal A' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const meal2 = await createMeal(createTestMealData({ name: 'Meal B' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const meal3 = await createMeal(createTestMealData({ name: 'Meal C' }));

      const meals = await getAllMeals();

      expect(meals.length).toBe(3);
      // Should be ordered by created DESC (newest first)
      expect(meals[0].id).toBe(meal3.id);
      expect(meals[1].id).toBe(meal2.id);
      expect(meals[2].id).toBe(meal1.id);
    });

    it('should return meals with correct data structure', async () => {
      const testData = createTestMealData();
      const created = await createMeal(testData);

      const meals = await getAllMeals();
      const meal = meals.find((m) => m.id === created.id);

      expect(meal).toBeDefined();
      expect(meal?.id).toBe(created.id);
      expect(meal?.name).toBe(testData.name);
      expect(meal?.type).toBe(testData.type);
      expect(meal?.description).toBe(testData.description);
      expect(meal?.created).toBeInstanceOf(Date);
    });

    it('should return meals with different types', async () => {
      const appetizer = await createMeal(createTestMealData({ type: MealType.APPETIZER }));
      const mainCourse = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE }));
      const dessert = await createMeal(createTestMealData({ type: MealType.DESSERT }));

      const meals = await getAllMeals();

      expect(meals.length).toBe(3);
      const types = meals.map((m) => m.type);
      expect(types).toContain(MealType.APPETIZER);
      expect(types).toContain(MealType.MAIN_COURSE);
      expect(types).toContain(MealType.DESSERT);
    });
  });

  describe('getMealById', () => {
    it('should return null when meal does not exist', async () => {
      const meal = await getMealById(99999);
      expect(meal).toBeNull();
    });

    it('should return meal when it exists', async () => {
      const testData = createTestMealData();
      const created = await createMeal(testData);

      const meal = await getMealById(created.id);

      expect(meal).not.toBeNull();
      expect(meal?.id).toBe(created.id);
      expect(meal?.name).toBe(testData.name);
      expect(meal?.type).toBe(testData.type);
      expect(meal?.description).toBe(testData.description);
      expect(meal?.created).toBeInstanceOf(Date);
    });

    it('should return correct meal type', async () => {
      const testData = createTestMealData({ type: MealType.DESSERT });
      const created = await createMeal(testData);

      const meal = await getMealById(created.id);

      expect(meal?.type).toBe(MealType.DESSERT);
    });
  });

  describe('createMeal', () => {
    it('should create a new meal and return it', async () => {
      const testData = createTestMealData();

      const meal = await createMeal(testData);

      expect(meal.id).toBeGreaterThan(0);
      expect(meal.name).toBe(testData.name);
      expect(meal.type).toBe(testData.type);
      expect(meal.description).toBe(testData.description);
      expect(meal.created).toBeInstanceOf(Date);
    });

    it('should create meal with appetizer type', async () => {
      const testData = createTestMealData({ type: MealType.APPETIZER });

      const meal = await createMeal(testData);

      expect(meal.type).toBe(MealType.APPETIZER);
    });

    it('should create meal with main course type', async () => {
      const testData = createTestMealData({ type: MealType.MAIN_COURSE });

      const meal = await createMeal(testData);

      expect(meal.type).toBe(MealType.MAIN_COURSE);
    });

    it('should create meal with dessert type', async () => {
      const testData = createTestMealData({ type: MealType.DESSERT });

      const meal = await createMeal(testData);

      expect(meal.type).toBe(MealType.DESSERT);
    });
  });

  describe('updateMeal', () => {
    it('should update meal name', async () => {
      const created = await createMeal(createTestMealData());
      const newName = 'Updated Meal Name';

      const updated = await updateMeal(created.id, { name: newName });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(newName);
      expect(updated.type).toBe(created.type);
      expect(updated.description).toBe(created.description);
    });

    it('should update meal type', async () => {
      const created = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE }));
      const newType = MealType.DESSERT;

      const updated = await updateMeal(created.id, { type: newType });

      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe(newType);
      expect(updated.name).toBe(created.name);
      expect(updated.description).toBe(created.description);
    });

    it('should update multiple fields at once', async () => {
      const created = await createMeal(createTestMealData());
      const updates = {
        name: 'Updated Meal Name',
        type: MealType.APPETIZER,
      };

      const updated = await updateMeal(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updates.name);
      expect(updated.type).toBe(updates.type);
      expect(updated.description).toBe(created.description);
    });

    it('should return unchanged meal when no updates provided', async () => {
      const created = await createMeal(createTestMealData());

      const updated = await updateMeal(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(created.name);
      expect(updated.type).toBe(created.type);
      expect(updated.description).toBe(created.description);
    });

    it('should throw error when meal does not exist', async () => {
      await expect(updateMeal(99999, { name: 'Test' })).rejects.toThrow('Meal not found');
    });

    it('should update type to all valid meal types', async () => {
      const created = await createMeal(createTestMealData({ type: MealType.MAIN_COURSE }));

      // Update to appetizer
      let updated = await updateMeal(created.id, { type: MealType.APPETIZER });
      expect(updated.type).toBe(MealType.APPETIZER);

      // Update to dessert
      updated = await updateMeal(created.id, { type: MealType.DESSERT });
      expect(updated.type).toBe(MealType.DESSERT);

      // Update back to main course
      updated = await updateMeal(created.id, { type: MealType.MAIN_COURSE });
      expect(updated.type).toBe(MealType.MAIN_COURSE);
    });
  });

  describe('deleteMeal', () => {
    it('should delete an existing meal', async () => {
      const created = await createMeal(createTestMealData());

      await deleteMeal(created.id);

      const meal = await getMealById(created.id);
      expect(meal).toBeNull();
    });

    it('should throw error when meal does not exist', async () => {
      await expect(deleteMeal(99999)).rejects.toThrow('Meal not found');
    });

    it('should allow creating meal with same name after deletion', async () => {
      const testData = createTestMealData();
      const created = await createMeal(testData);

      await deleteMeal(created.id);

      // Should be able to create with same name after deletion
      const newMeal = await createMeal(testData);
      expect(newMeal.name).toBe(testData.name);
    });
  });

  describe('description field', () => {
    it('should create meal with description', async () => {
      const testData = createTestMealData({ description: 'A delicious test meal' });

      const meal = await createMeal(testData);

      expect(meal.description).toBe('A delicious test meal');
    });

    it('should update meal description', async () => {
      const created = await createMeal(createTestMealData());
      const newDescription = 'Updated description';

      const updated = await updateMeal(created.id, { description: newDescription });

      expect(updated.id).toBe(created.id);
      expect(updated.description).toBe(newDescription);
      expect(updated.name).toBe(created.name);
      expect(updated.type).toBe(created.type);
    });

    it('should update description along with other fields', async () => {
      const created = await createMeal(createTestMealData());
      const updates = {
        name: 'Updated Meal Name',
        description: 'Updated description',
      };

      const updated = await updateMeal(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updates.name);
      expect(updated.description).toBe(updates.description);
      expect(updated.type).toBe(created.type);
    });
  });
});
