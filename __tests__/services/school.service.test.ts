import { describe, expect, it } from 'vitest';
import { createSchool, deleteSchool, getAllSchools, getSchoolById, updateSchool, } from '@/lib/services/school.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestSchoolData } from '../helpers/test-data';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('School Service', () => {
  describe('getAllSchools', () => {
    it('should return empty array when no schools exist', async () => {
      const schools = await getAllSchools();
      expect(schools).toEqual([]);
      expect(schools.length).toBe(0);
    });

    it('should return all schools ordered by created DESC', async () => {
      // Create test schools
      const school1 = await createSchool(createTestSchoolData({ name: 'School A' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const school2 = await createSchool(createTestSchoolData({ name: 'School B' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const school3 = await createSchool(createTestSchoolData({ name: 'School C' }));

      const schools = await getAllSchools();

      expect(schools.length).toBe(3);
      // Should be ordered by created DESC (newest first)
      expect(schools[0].id).toBe(school3.id);
      expect(schools[1].id).toBe(school2.id);
      expect(schools[2].id).toBe(school1.id);
    });

    it('should return schools with correct data structure', async () => {
      const testData = createTestSchoolData();
      const created = await createSchool(testData);

      const schools = await getAllSchools();
      const school = schools.find((s) => s.id === created.id);

      expect(school).toBeDefined();
      expect(school?.id).toBe(created.id);
      expect(school?.name).toBe(testData.name);
      expect(school?.code).toBe(created.code); // Code is auto-generated
      expect(school?.code).toMatch(/^[A-Z0-9]{6}$/); // Verify code format
      expect(school?.description).toBe(testData.description);
      expect(school?.created).toBeInstanceOf(Date);
    });
  });

  describe('getSchoolById', () => {
    it('should return null when school does not exist', async () => {
      const school = await getSchoolById(99999);
      expect(school).toBeNull();
    });

    it('should return school when it exists', async () => {
      const testData = createTestSchoolData();
      const created = await createSchool(testData);

      const school = await getSchoolById(created.id);

      expect(school).not.toBeNull();
      expect(school?.id).toBe(created.id);
      expect(school?.name).toBe(testData.name);
      expect(school?.code).toBe(created.code); // Code is auto-generated
      expect(school?.code).toMatch(/^[A-Z0-9]{6}$/); // Verify code format
      expect(school?.description).toBe(testData.description);
      expect(school?.created).toBeInstanceOf(Date);
    });
  });

  describe('createSchool', () => {
    it('should create a new school and return it', async () => {
      const testData = createTestSchoolData();

      const school = await createSchool(testData);

      expect(school.id).toBeGreaterThan(0);
      expect(school.name).toBe(testData.name);
      expect(school.code).toMatch(/^[A-Z0-9]{6}$/); // Code is auto-generated, verify format
      expect(school.description).toBe(testData.description);
      expect(school.created).toBeInstanceOf(Date);
    });

    it('should generate unique codes for multiple schools', async () => {
      const testData = createTestSchoolData();
      const school1 = await createSchool(testData);
      const school2 = await createSchool(testData);

      // Codes should be different (auto-generated)
      expect(school1.code).not.toBe(school2.code);
      expect(school1.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(school2.code).toMatch(/^[A-Z0-9]{6}$/);
    });
  });

  describe('updateSchool', () => {
    it('should update school name', async () => {
      const created = await createSchool(createTestSchoolData());
      const newName = 'Updated School Name';

      const updated = await updateSchool(created.id, { name: newName });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(newName);
      expect(updated.code).toBe(created.code);
      expect(updated.description).toBe(created.description);
    });

    it('should update school description', async () => {
      const created = await createSchool(createTestSchoolData());
      const newDescription = 'Updated description';

      const updated = await updateSchool(created.id, { description: newDescription });

      expect(updated.id).toBe(created.id);
      expect(updated.description).toBe(newDescription);
    });

    it('should update multiple fields at once', async () => {
      const created = await createSchool(createTestSchoolData());
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const updated = await updateSchool(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updates.name);
      expect(updated.code).toBe(created.code); // Code should remain unchanged
      expect(updated.description).toBe(updates.description);
    });

    it('should return unchanged school when no updates provided', async () => {
      const created = await createSchool(createTestSchoolData());

      const updated = await updateSchool(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(created.name);
      expect(updated.code).toBe(created.code);
      expect(updated.description).toBe(created.description);
    });

    it('should throw error when school does not exist', async () => {
      await expect(updateSchool(99999, { name: 'Test' })).rejects.toThrow('School not found');
    });
  });

  describe('deleteSchool', () => {
    it('should delete an existing school', async () => {
      const created = await createSchool(createTestSchoolData());

      await deleteSchool(created.id);

      const school = await getSchoolById(created.id);
      expect(school).toBeNull();
    });

    it('should throw error when school does not exist', async () => {
      await expect(deleteSchool(99999)).rejects.toThrow('School not found');
    });

    it('should allow creating school after deletion', async () => {
      const testData = createTestSchoolData();
      const created = await createSchool(testData);

      await deleteSchool(created.id);

      // Should be able to create a new school after deletion
      const newSchool = await createSchool(testData);
      expect(newSchool.id).toBeGreaterThan(0);
      expect(newSchool.name).toBe(testData.name);
      expect(newSchool.code).toMatch(/^[A-Z0-9]{6}$/); // Code is auto-generated
    });
  });
});
