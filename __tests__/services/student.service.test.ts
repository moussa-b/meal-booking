import { describe, expect, it } from 'vitest';
import {
  createStudent,
  deleteStudent,
  getAllStudents,
  getStudentById,
  getStudentsByParentEmail,
  updateStudent,
} from '@/lib/services/student.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestStudentData } from '../helpers/test-data';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('Student Service', () => {
  describe('getAllStudents', () => {
    it('should return empty array when no students exist', async () => {
      const students = await getAllStudents();
      expect(students).toEqual([]);
      expect(students.length).toBe(0);
    });

    it('should return all students ordered by created DESC', async () => {
      // Create test students with 1 second delay between each to ensure distinct timestamps
      const student1 = await createStudent(createTestStudentData({ firstName: 'Student A' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const student2 = await createStudent(createTestStudentData({ firstName: 'Student B' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const student3 = await createStudent(createTestStudentData({ firstName: 'Student C' }));

      const students = await getAllStudents();

      expect(students.length).toBe(3);
      // Should be ordered by created DESC (newest first)
      expect(students[0].id).toBe(student3.id);
      expect(students[1].id).toBe(student2.id);
      expect(students[2].id).toBe(student1.id);
    });

    it('should return students with correct data structure', async () => {
      const testData = createTestStudentData();
      const created = await createStudent(testData);

      const students = await getAllStudents();
      const student = students.find((s) => s.id === created.id);

      expect(student).toBeDefined();
      expect(student?.id).toBe(created.id);
      expect(student?.lastName).toBe(testData.lastName);
      expect(student?.firstName).toBe(testData.firstName);
      expect(student?.class).toBe(testData.class);
      expect(student?.feedingRegime).toBe(testData.feedingRegime);
      expect(student?.parentEmail).toBe(testData.parentEmail);
      expect(student?.created).toBeInstanceOf(Date);
    });
  });

  describe('getStudentById', () => {
    it('should return null when student does not exist', async () => {
      const student = await getStudentById(99999);
      expect(student).toBeNull();
    });

    it('should return student when it exists', async () => {
      const testData = createTestStudentData();
      const created = await createStudent(testData);

      const student = await getStudentById(created.id);

      expect(student).not.toBeNull();
      expect(student?.id).toBe(created.id);
      expect(student?.lastName).toBe(testData.lastName);
      expect(student?.firstName).toBe(testData.firstName);
      expect(student?.class).toBe(testData.class);
      expect(student?.feedingRegime).toBe(testData.feedingRegime);
      expect(student?.parentEmail).toBe(testData.parentEmail);
      expect(student?.created).toBeInstanceOf(Date);
    });
  });

  describe('getStudentsByParentEmail', () => {
    it('should return empty array when no students exist for email', async () => {
      const students = await getStudentsByParentEmail('nonexistent@example.com');
      expect(students).toEqual([]);
    });

    it('should return students for a specific parent email', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;
      const student1 = await createStudent(createTestStudentData({ parentEmail, firstName: 'Child1' }));
      const student2 = await createStudent(createTestStudentData({ parentEmail, firstName: 'Child2' }));
      // Create a student with different parent email
      await createStudent(createTestStudentData({ parentEmail: 'other@example.com', firstName: 'Other' }));

      const students = await getStudentsByParentEmail(parentEmail);

      expect(students.length).toBe(2);
      const studentIds = students.map((s) => s.id);
      expect(studentIds).toContain(student1.id);
      expect(studentIds).toContain(student2.id);
    });

    it('should return only students with matching parent email', async () => {
      const parentEmail1 = `parent1${Date.now()}@example.com`;
      const parentEmail2 = `parent2${Date.now()}@example.com`;

      await createStudent(createTestStudentData({ parentEmail: parentEmail1, firstName: 'Child1' }));
      await createStudent(createTestStudentData({ parentEmail: parentEmail1, firstName: 'Child2' }));
      await createStudent(createTestStudentData({ parentEmail: parentEmail2, firstName: 'Child3' }));

      const students = await getStudentsByParentEmail(parentEmail1);
      expect(students.length).toBe(2);
      students.forEach((student) => {
        expect(student.parentEmail).toBe(parentEmail1);
      });
    });
  });

  describe('createStudent', () => {
    it('should create a new student and return it', async () => {
      const testData = createTestStudentData();

      const student = await createStudent(testData);

      expect(student.id).toBeGreaterThan(0);
      expect(student.lastName).toBe(testData.lastName);
      expect(student.firstName).toBe(testData.firstName);
      expect(student.class).toBe(testData.class);
      expect(student.feedingRegime).toBe(testData.feedingRegime);
      expect(student.parentEmail).toBe(testData.parentEmail);
      expect(student.created).toBeInstanceOf(Date);
    });

    it('should create student with parentEmail', async () => {
      const parentEmail = `parent${Date.now()}@example.com`;
      const testData = createTestStudentData({ parentEmail });

      const student = await createStudent(testData);

      expect(student.parentEmail).toBe(parentEmail);
    });

    it('should create student without parentEmail', async () => {
      const testData = createTestStudentData({ parentEmail: null });

      const student = await createStudent(testData);

      expect(student.parentEmail).toBeUndefined();
    });

    it('should create student with feedingRegime', async () => {
      const testData = createTestStudentData({ feedingRegime: 'Végétarien' });

      const student = await createStudent(testData);

      expect(student.feedingRegime).toBe('Végétarien');
    });

    it('should create student without feedingRegime', async () => {
      const testData = createTestStudentData({ feedingRegime: null });

      const student = await createStudent(testData);

      expect(student.feedingRegime).toBeNull();
    });
  });

  describe('updateStudent', () => {
    it('should update student lastName', async () => {
      const created = await createStudent(createTestStudentData());
      const newLastName = 'UpdatedLastName';

      const updated = await updateStudent(created.id, { lastName: newLastName });

      expect(updated.id).toBe(created.id);
      expect(updated.lastName).toBe(newLastName);
      expect(updated.firstName).toBe(created.firstName);
      expect(updated.class).toBe(created.class);
    });

    it('should update student firstName', async () => {
      const created = await createStudent(createTestStudentData());
      const newFirstName = 'UpdatedFirstName';

      const updated = await updateStudent(created.id, { firstName: newFirstName });

      expect(updated.id).toBe(created.id);
      expect(updated.firstName).toBe(newFirstName);
      expect(updated.lastName).toBe(created.lastName);
    });

    it('should update student class', async () => {
      const created = await createStudent(createTestStudentData());
      const newClass = 'CM2';

      const updated = await updateStudent(created.id, { class: newClass });

      expect(updated.id).toBe(created.id);
      expect(updated.class).toBe(newClass);
    });

    it('should update student feedingRegime', async () => {
      const created = await createStudent(createTestStudentData());
      const newFeedingRegime = 'Hallal';

      const updated = await updateStudent(created.id, { feedingRegime: newFeedingRegime });

      expect(updated.id).toBe(created.id);
      expect(updated.feedingRegime).toBe(newFeedingRegime);
    });

    it('should update student parentEmail', async () => {
      const created = await createStudent(createTestStudentData());
      const newParentEmail = `newparent${Date.now()}@example.com`;

      const updated = await updateStudent(created.id, { parentEmail: newParentEmail });

      expect(updated.id).toBe(created.id);
      expect(updated.parentEmail).toBe(newParentEmail);
    });

    it('should update multiple fields at once', async () => {
      const created = await createStudent(createTestStudentData());
      const updates = {
        lastName: 'UpdatedLastName',
        firstName: 'UpdatedFirstName',
        class: 'CM2',
      };

      const updated = await updateStudent(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.lastName).toBe(updates.lastName);
      expect(updated.firstName).toBe(updates.firstName);
      expect(updated.class).toBe(updates.class);
    });

    it('should return unchanged student when no updates provided', async () => {
      const created = await createStudent(createTestStudentData());

      const updated = await updateStudent(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.lastName).toBe(created.lastName);
      expect(updated.firstName).toBe(created.firstName);
      expect(updated.class).toBe(created.class);
    });

    it('should throw error when student does not exist', async () => {
      await expect(updateStudent(99999, { lastName: 'Test' })).rejects.toThrow('Student not found');
    });
  });

  describe('deleteStudent', () => {
    it('should delete an existing student', async () => {
      const created = await createStudent(createTestStudentData());

      await deleteStudent(created.id);

      const student = await getStudentById(created.id);
      expect(student).toBeNull();
    });

    it('should throw error when student does not exist', async () => {
      await expect(deleteStudent(99999)).rejects.toThrow('Student not found');
    });

    it('should allow creating student after deletion', async () => {
      const testData = createTestStudentData();
      const created = await createStudent(testData);

      await deleteStudent(created.id);

      // Should be able to create a new student after deletion
      const newStudent = await createStudent(testData);
      expect(newStudent.id).toBeGreaterThan(0);
      expect(newStudent.lastName).toBe(testData.lastName);
      expect(newStudent.firstName).toBe(testData.firstName);
    });
  });
});
