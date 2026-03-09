import { describe, expect, it } from 'vitest';
import {
  createMealParticipant,
  deleteMealParticipant,
  getAllMealParticipants,
  getMealParticipantById,
  getMealParticipantsByParentEmail,
  getMealParticipantsGroupedByParentEmail,
  updateMealParticipant,
} from '@/lib/services/meal-participant.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestMealParticipantData } from '../helpers/test-data';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('MealParticipant Service', () => {
  describe('getAllMealParticipants', () => {
    it('should return empty array when no mealParticipants exist', async () => {
      const mealParticipants = await getAllMealParticipants();
      expect(mealParticipants).toEqual([]);
      expect(mealParticipants.length).toBe(0);
    });

    it('should return all mealParticipants ordered by created DESC', async () => {
      // Create test mealParticipants with 1 second delay between each to ensure distinct timestamps
      const mealParticipant1 = await createMealParticipant(createTestMealParticipantData({ firstName: 'MealParticipant A' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mealParticipant2 = await createMealParticipant(createTestMealParticipantData({ firstName: 'MealParticipant B' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mealParticipant3 = await createMealParticipant(createTestMealParticipantData({ firstName: 'MealParticipant C' }));

      const mealParticipants = await getAllMealParticipants();

      expect(mealParticipants.length).toBe(3);
      // Should be ordered by created DESC (newest first)
      expect(mealParticipants[0].id).toBe(mealParticipant3.id);
      expect(mealParticipants[1].id).toBe(mealParticipant2.id);
      expect(mealParticipants[2].id).toBe(mealParticipant1.id);
    });

    it('should return mealParticipants with correct data structure', async () => {
      const testData = createTestMealParticipantData();
      const created = await createMealParticipant(testData);

      const mealParticipants = await getAllMealParticipants();
      const mealParticipant = mealParticipants.find((s) => s.id === created.id);

      expect(mealParticipant).toBeDefined();
      expect(mealParticipant?.id).toBe(created.id);
      expect(mealParticipant?.lastName).toBe(testData.lastName);
      expect(mealParticipant?.firstName).toBe(testData.firstName);
      expect(mealParticipant?.class).toBe(testData.class);
      expect(mealParticipant?.type).toBe(testData.type);
      expect(mealParticipant?.feedingRegime).toBe(testData.feedingRegime);
      expect(mealParticipant?.parentEmail).toBe(testData.parentEmail);
      expect(mealParticipant?.created).toBeInstanceOf(Date);
    });
  });

  describe('getMealParticipantById', () => {
    it('should return null when mealParticipant does not exist', async () => {
      const mealParticipant = await getMealParticipantById(99999);
      expect(mealParticipant).toBeNull();
    });

    it('should return mealParticipant when it exists', async () => {
      const testData = createTestMealParticipantData();
      const created = await createMealParticipant(testData);

      const mealParticipant = await getMealParticipantById(created.id);

      expect(mealParticipant).not.toBeNull();
      expect(mealParticipant?.id).toBe(created.id);
      expect(mealParticipant?.lastName).toBe(testData.lastName);
      expect(mealParticipant?.firstName).toBe(testData.firstName);
      expect(mealParticipant?.class).toBe(testData.class);
      expect(mealParticipant?.type).toBe(testData.type);
      expect(mealParticipant?.feedingRegime).toBe(testData.feedingRegime);
      expect(mealParticipant?.parentEmail).toBe(testData.parentEmail);
      expect(mealParticipant?.created).toBeInstanceOf(Date);
    });
  });

  describe('getMealParticipantsByParentEmail', () => {
    it('should return empty array when no mealParticipants exist for email', async () => {
      const mealParticipants = await getMealParticipantsByParentEmail('nonexistent@example.com');
      expect(mealParticipants).toEqual([]);
    });

    it('should return mealParticipants for a specific parent email', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;
      const mealParticipant1 = await createMealParticipant(createTestMealParticipantData({ parentEmail, firstName: 'Child1' }));
      const mealParticipant2 = await createMealParticipant(createTestMealParticipantData({ parentEmail, firstName: 'Child2' }));
      // Create a mealParticipant with different parent email
      await createMealParticipant(createTestMealParticipantData({ parentEmail: 'other@example.com', firstName: 'Other' }));

      const mealParticipants = await getMealParticipantsByParentEmail(parentEmail);

      expect(mealParticipants.length).toBe(2);
      const mealParticipantIds = mealParticipants.map((s) => s.id);
      expect(mealParticipantIds).toContain(mealParticipant1.id);
      expect(mealParticipantIds).toContain(mealParticipant2.id);
    });

    it('should return only mealParticipants with matching parent email', async () => {
      const parentEmail1 = `parent1${Date.now()}@example.com`;
      const parentEmail2 = `parent2${Date.now()}@example.com`;

      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail1, firstName: 'Child1' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail1, firstName: 'Child2' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail2, firstName: 'Child3' }));

      const mealParticipants = await getMealParticipantsByParentEmail(parentEmail1);
      expect(mealParticipants.length).toBe(2);
      mealParticipants.forEach((mealParticipant) => {
        expect(mealParticipant.parentEmail).toBe(parentEmail1);
      });
    });

    it('should preserve mealParticipant type when filtering by parent email', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;

      await createMealParticipant(
        createTestMealParticipantData({
          parentEmail,
          firstName: 'School Participant',
          type: 'school',
        })
      );
      await createMealParticipant(
        createTestMealParticipantData({
          parentEmail,
          firstName: 'Company Participant',
          type: 'company',
        })
      );

      const mealParticipants = await getMealParticipantsByParentEmail(parentEmail);

      expect(mealParticipants).toHaveLength(2);
      expect(mealParticipants.map((mealParticipant) => mealParticipant.type).sort()).toEqual([
        'company',
        'school',
      ]);
    });
  });

  describe('getMealParticipantsGroupedByParentEmail', () => {
    it('should return empty array when no mealParticipants exist', async () => {
      const groups = await getMealParticipantsGroupedByParentEmail();
      expect(groups).toEqual([]);
    });

    it('should group mealParticipants by parent email', async () => {
      const parentEmail1 = `parent1${Date.now()}@example.com`;
      const parentEmail2 = `parent2${Date.now()}@example.com`;

      const mealParticipant1 = await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail1, firstName: 'Alice', lastName: 'Smith' }));
      const mealParticipant2 = await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail1, firstName: 'Bob', lastName: 'Smith' }));
      const mealParticipant3 = await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail2, firstName: 'Charlie', lastName: 'Brown' }));

      const groups = await getMealParticipantsGroupedByParentEmail();

      expect(groups.length).toBe(2);

      const group1 = groups.find(g => g.parentEmail === parentEmail1);
      expect(group1).toBeDefined();
      expect(group1?.mealParticipants.length).toBe(2);
      expect(group1?.mealParticipants.map(s => s.id)).toContain(mealParticipant1.id);
      expect(group1?.mealParticipants.map(s => s.id)).toContain(mealParticipant2.id);

      const group2 = groups.find(g => g.parentEmail === parentEmail2);
      expect(group2).toBeDefined();
      expect(group2?.mealParticipants.length).toBe(1);
      expect(group2?.mealParticipants[0].id).toBe(mealParticipant3.id);
    });

    it('should group mealParticipants without parent email together', async () => {
      const mealParticipant1 = await createMealParticipant(createTestMealParticipantData({ parentEmail: null, firstName: 'NoEmail1', lastName: 'MealParticipant' }));
      const mealParticipant2 = await createMealParticipant(createTestMealParticipantData({ parentEmail: null, firstName: 'NoEmail2', lastName: 'MealParticipant' }));
      const mealParticipant3 = await createMealParticipant(createTestMealParticipantData({ parentEmail: 'parent@example.com', firstName: 'WithEmail', lastName: 'MealParticipant' }));

      const groups = await getMealParticipantsGroupedByParentEmail();

      expect(groups.length).toBe(2);

      const nullGroup = groups.find(g => g.parentEmail === null);
      expect(nullGroup).toBeDefined();
      expect(nullGroup?.mealParticipants.length).toBe(2);
      expect(nullGroup?.mealParticipants.map(s => s.id)).toContain(mealParticipant1.id);
      expect(nullGroup?.mealParticipants.map(s => s.id)).toContain(mealParticipant2.id);

      const emailGroup = groups.find(g => g.parentEmail === 'parent@example.com');
      expect(emailGroup).toBeDefined();
      expect(emailGroup?.mealParticipants.length).toBe(1);
      expect(emailGroup?.mealParticipants[0].id).toBe(mealParticipant3.id);
    });

    it('should sort groups alphabetically by parent email with null emails last', async () => {
      const parentEmailA = `a_parent${Date.now()}@example.com`;
      const parentEmailZ = `z_parent${Date.now()}@example.com`;

      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmailZ, firstName: 'Z' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: null, firstName: 'Null' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmailA, firstName: 'A' }));

      const groups = await getMealParticipantsGroupedByParentEmail();

      expect(groups.length).toBe(3);
      // First group should be parentEmailA (alphabetically first)
      expect(groups[0].parentEmail).toBe(parentEmailA);
      // Second group should be parentEmailZ (alphabetically second)
      expect(groups[1].parentEmail).toBe(parentEmailZ);
      // Last group should be null (null emails last)
      expect(groups[2].parentEmail).toBeNull();
    });

    it('should sort mealParticipants within each group by last name then first name', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;

      // Create mealParticipants in non-alphabetical order
      const mealParticipant1 = await createMealParticipant(createTestMealParticipantData({
        parentEmail,
        firstName: 'Charlie',
        lastName: 'Zebra'
      }));
      const mealParticipant2 = await createMealParticipant(createTestMealParticipantData({
        parentEmail,
        firstName: 'Alice',
        lastName: 'Apple'
      }));
      const mealParticipant3 = await createMealParticipant(createTestMealParticipantData({
        parentEmail,
        firstName: 'Bob',
        lastName: 'Apple'
      }));

      const groups = await getMealParticipantsGroupedByParentEmail();
      const group = groups.find(g => g.parentEmail === parentEmail);

      expect(group).toBeDefined();
      expect(group?.mealParticipants.length).toBe(3);

      // Should be sorted alphabetically: Apple Alice, Apple Bob, Zebra Charlie
      expect(group?.mealParticipants[0].lastName).toBe('Apple');
      expect(group?.mealParticipants[0].firstName).toBe('Alice');
      expect(group?.mealParticipants[1].lastName).toBe('Apple');
      expect(group?.mealParticipants[1].firstName).toBe('Bob');
      expect(group?.mealParticipants[2].lastName).toBe('Zebra');
      expect(group?.mealParticipants[2].firstName).toBe('Charlie');
    });

    it('should handle multiple groups with different parent emails', async () => {
      const parentEmail1 = `parent1${Date.now()}@example.com`;
      const parentEmail2 = `parent2${Date.now()}@example.com`;
      const parentEmail3 = `parent3${Date.now()}@example.com`;

      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail1, firstName: 'Child1' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail1, firstName: 'Child2' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail2, firstName: 'Child3' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail3, firstName: 'Child4' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail3, firstName: 'Child5' }));
      await createMealParticipant(createTestMealParticipantData({ parentEmail: parentEmail3, firstName: 'Child6' }));

      const groups = await getMealParticipantsGroupedByParentEmail();

      expect(groups.length).toBe(3);

      const group1 = groups.find(g => g.parentEmail === parentEmail1);
      expect(group1?.mealParticipants.length).toBe(2);

      const group2 = groups.find(g => g.parentEmail === parentEmail2);
      expect(group2?.mealParticipants.length).toBe(1);

      const group3 = groups.find(g => g.parentEmail === parentEmail3);
      expect(group3?.mealParticipants.length).toBe(3);
    });

    it('should return correct data structure for each group', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;
      const testData = createTestMealParticipantData({ parentEmail, firstName: 'Test', lastName: 'MealParticipant' });
      const created = await createMealParticipant(testData);

      const groups = await getMealParticipantsGroupedByParentEmail();
      const group = groups.find(g => g.parentEmail === parentEmail);

      expect(group).toBeDefined();
      expect(group?.parentEmail).toBe(parentEmail);
      expect(group?.mealParticipants.length).toBe(1);

      const mealParticipant = group?.mealParticipants[0];
      expect(mealParticipant?.id).toBe(created.id);
      expect(mealParticipant?.lastName).toBe(testData.lastName);
      expect(mealParticipant?.firstName).toBe(testData.firstName);
      expect(mealParticipant?.class).toBe(testData.class);
      expect(mealParticipant?.type).toBe(testData.type);
      expect(mealParticipant?.feedingRegime).toBe(testData.feedingRegime);
      expect(mealParticipant?.parentEmail).toBe(parentEmail);
      expect(mealParticipant?.created).toBeInstanceOf(Date);
    });
  });

  describe('createMealParticipant', () => {
    it('should create a new mealParticipant and return it', async () => {
      const testData = createTestMealParticipantData();

      const mealParticipant = await createMealParticipant(testData);

      expect(mealParticipant.id).toBeGreaterThan(0);
      expect(mealParticipant.lastName).toBe(testData.lastName);
      expect(mealParticipant.firstName).toBe(testData.firstName);
      expect(mealParticipant.class).toBe(testData.class);
      expect(mealParticipant.type).toBe(testData.type);
      expect(mealParticipant.feedingRegime).toBe(testData.feedingRegime);
      expect(mealParticipant.parentEmail).toBe(testData.parentEmail);
      expect(mealParticipant.created).toBeInstanceOf(Date);
    });

    it('should create mealParticipant with parentEmail', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;
      const testData = createTestMealParticipantData({ parentEmail });

      const mealParticipant = await createMealParticipant(testData);

      expect(mealParticipant.parentEmail).toBe(parentEmail);
    });

    it('should create mealParticipant without parentEmail', async () => {
      const testData = createTestMealParticipantData({ parentEmail: null });

      const mealParticipant = await createMealParticipant(testData);

      expect(mealParticipant.parentEmail).toBeUndefined();
    });

    it('should create mealParticipant with feedingRegime', async () => {
      const testData = createTestMealParticipantData({ feedingRegime: 'Végétarien' });

      const mealParticipant = await createMealParticipant(testData);

      expect(mealParticipant.feedingRegime).toBe('Végétarien');
    });

    it('should create mealParticipant without feedingRegime', async () => {
      const testData = createTestMealParticipantData({ feedingRegime: null });

      const mealParticipant = await createMealParticipant(testData);

      expect(mealParticipant.feedingRegime).toBeNull();
    });

    it('should create mealParticipant with company type', async () => {
      const mealParticipant = await createMealParticipant(
        createTestMealParticipantData({ type: 'company' })
      );

      expect(mealParticipant.type).toBe('company');
    });
  });

  describe('updateMealParticipant', () => {
    it('should update mealParticipant lastName', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());
      const newLastName = 'UpdatedLastName';

      const updated = await updateMealParticipant(created.id, { lastName: newLastName });

      expect(updated.id).toBe(created.id);
      expect(updated.lastName).toBe(newLastName);
      expect(updated.firstName).toBe(created.firstName);
      expect(updated.class).toBe(created.class);
    });

    it('should update mealParticipant firstName', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());
      const newFirstName = 'UpdatedFirstName';

      const updated = await updateMealParticipant(created.id, { firstName: newFirstName });

      expect(updated.id).toBe(created.id);
      expect(updated.firstName).toBe(newFirstName);
      expect(updated.lastName).toBe(created.lastName);
    });

    it('should update mealParticipant class', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());
      const newClass = 'CM2';

      const updated = await updateMealParticipant(created.id, { class: newClass });

      expect(updated.id).toBe(created.id);
      expect(updated.class).toBe(newClass);
    });

    it('should update mealParticipant feedingRegime', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());
      const newFeedingRegime = 'Hallal';

      const updated = await updateMealParticipant(created.id, { feedingRegime: newFeedingRegime });

      expect(updated.id).toBe(created.id);
      expect(updated.feedingRegime).toBe(newFeedingRegime);
    });

    it('should update mealParticipant parentEmail', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());
      const newParentEmail = `newparent${Date.now()}@example.com`;

      const updated = await updateMealParticipant(created.id, { parentEmail: newParentEmail });

      expect(updated.id).toBe(created.id);
      expect(updated.parentEmail).toBe(newParentEmail);
    });

    it('should update mealParticipant type', async () => {
      const created = await createMealParticipant(
        createTestMealParticipantData({ type: 'school' })
      );

      const updated = await updateMealParticipant(created.id, { type: 'company' });

      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe('company');
    });

    it('should update multiple fields at once', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());
      const updates = {
        lastName: 'UpdatedLastName',
        firstName: 'UpdatedFirstName',
        class: 'CM2',
      };

      const updated = await updateMealParticipant(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.lastName).toBe(updates.lastName);
      expect(updated.firstName).toBe(updates.firstName);
      expect(updated.class).toBe(updates.class);
    });

    it('should return unchanged mealParticipant when no updates provided', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());

      const updated = await updateMealParticipant(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.lastName).toBe(created.lastName);
      expect(updated.firstName).toBe(created.firstName);
      expect(updated.class).toBe(created.class);
      expect(updated.type).toBe(created.type);
    });

    it('should throw error when mealParticipant does not exist', async () => {
      await expect(updateMealParticipant(99999, { lastName: 'Test' })).rejects.toThrow('Meal participant not found');
    });
  });

  describe('deleteMealParticipant', () => {
    it('should delete an existing mealParticipant', async () => {
      const created = await createMealParticipant(createTestMealParticipantData());

      await deleteMealParticipant(created.id);

      const mealParticipant = await getMealParticipantById(created.id);
      expect(mealParticipant).toBeNull();
    });

    it('should throw error when mealParticipant does not exist', async () => {
      await expect(deleteMealParticipant(99999)).rejects.toThrow('Meal participant not found');
    });

    it('should allow creating mealParticipant after deletion', async () => {
      const testData = createTestMealParticipantData();
      const created = await createMealParticipant(testData);

      await deleteMealParticipant(created.id);

      // Should be able to create a new mealParticipant after deletion
      const newMealParticipant = await createMealParticipant(testData);
      expect(newMealParticipant.id).toBeGreaterThan(0);
      expect(newMealParticipant.lastName).toBe(testData.lastName);
      expect(newMealParticipant.firstName).toBe(testData.firstName);
    });
  });
});
