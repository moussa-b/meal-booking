import { describe, expect, it } from 'vitest';
import {
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getOrganizationById,
  getOrganizationByCode,
  updateOrganization,
} from '@/lib/services/organization.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestOrganizationData } from '../helpers/test-data';
import { DEFAULT_DAYS } from '@/lib/utils/date.utils';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('Organization Service', () => {
  describe('getAllOrganizations', () => {
    it('should return empty array when no organizations exist', async () => {
      const organizations = await getAllOrganizations();
      expect(organizations).toEqual([]);
      expect(organizations.length).toBe(0);
    });

    it('should return all organizations ordered alphabetically by name', async () => {
      const organizationA = await createOrganization(createTestOrganizationData({ name: 'Organization A' }));
      const organizationC = await createOrganization(createTestOrganizationData({ name: 'Organization C' }));
      const organizationB = await createOrganization(createTestOrganizationData({ name: 'Organization B' }));

      const organizations = await getAllOrganizations();

      expect(organizations.length).toBe(3);
      // Should be ordered alphabetically by name: A, B, C
      expect(organizations[0].id).toBe(organizationA.id);
      expect(organizations[1].id).toBe(organizationB.id);
      expect(organizations[2].id).toBe(organizationC.id);
    });

    it('should return organizations with correct data structure', async () => {
      const testData = createTestOrganizationData();
      const created = await createOrganization(testData);

      const organizations = await getAllOrganizations();
      const organization = organizations.find((s) => s.id === created.id);

      expect(organization).toBeDefined();
      expect(organization?.id).toBe(created.id);
      expect(organization?.name).toBe(testData.name);
      expect(organization?.code).toBe(created.code); // Code is auto-generated
      expect(organization?.code).toMatch(/^[A-Z0-9]{6}$/); // Verify code format
      expect(organization?.type).toBe(testData.type);
      expect(organization?.description).toBe(testData.description);
      expect(organization?.created).toBeInstanceOf(Date);
      expect(organization?.payLaterEnabled).toBe(true);
      expect(organization?.menuDayOfWeek).toEqual(DEFAULT_DAYS);
    });

    it('should preserve organization types for mixed results', async () => {
      await createOrganization(createTestOrganizationData({ name: 'School Org', type: 'school' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      await createOrganization(createTestOrganizationData({ name: 'Company Org', type: 'company' }));

      const organizations = await getAllOrganizations();

      expect(organizations.map((organization) => organization.type)).toContain('school');
      expect(organizations.map((organization) => organization.type)).toContain('company');
    });
  });

  describe('getOrganizationById', () => {
    it('should return null when organization does not exist', async () => {
      const organization = await getOrganizationById(99999);
      expect(organization).toBeNull();
    });

    it('should return organization when it exists', async () => {
      const testData = createTestOrganizationData();
      const created = await createOrganization(testData);

      const organization = await getOrganizationById(created.id);

      expect(organization).not.toBeNull();
      expect(organization?.id).toBe(created.id);
      expect(organization?.name).toBe(testData.name);
      expect(organization?.code).toBe(created.code); // Code is auto-generated
      expect(organization?.code).toMatch(/^[A-Z0-9]{6}$/); // Verify code format
      expect(organization?.type).toBe(testData.type);
      expect(organization?.description).toBe(testData.description);
      expect(organization?.created).toBeInstanceOf(Date);
    });
  });

  describe('getOrganizationByCode', () => {
    it('should return null when organization code does not exist', async () => {
      const organization = await getOrganizationByCode('INVALID');
      expect(organization).toBeNull();
    });

    it('should return organization when code exists', async () => {
      const testData = createTestOrganizationData();
      const created = await createOrganization(testData);

      const organization = await getOrganizationByCode(created.code);

      expect(organization).not.toBeNull();
      expect(organization?.id).toBe(created.id);
      expect(organization?.name).toBe(testData.name);
      expect(organization?.code).toBe(created.code);
      expect(organization?.code).toMatch(/^[A-Z0-9]{6}$/); // Verify code format
      expect(organization?.type).toBe(testData.type);
      expect(organization?.description).toBe(testData.description);
      expect(organization?.created).toBeInstanceOf(Date);
    });

    it('should return correct organization when multiple organizations exist', async () => {
      const testData1 = createTestOrganizationData({ name: 'Organization A' });
      const testData2 = createTestOrganizationData({ name: 'Organization B' });
      const organization1 = await createOrganization(testData1);
      const organization2 = await createOrganization(testData2);

      const foundOrganization1 = await getOrganizationByCode(organization1.code);
      const foundOrganization2 = await getOrganizationByCode(organization2.code);

      expect(foundOrganization1).not.toBeNull();
      expect(foundOrganization1?.id).toBe(organization1.id);
      expect(foundOrganization1?.name).toBe('Organization A');

      expect(foundOrganization2).not.toBeNull();
      expect(foundOrganization2?.id).toBe(organization2.id);
      expect(foundOrganization2?.name).toBe('Organization B');
    });

    it('should preserve organization type when fetched by code', async () => {
      const created = await createOrganization(
        createTestOrganizationData({ type: 'company' })
      );

      const organization = await getOrganizationByCode(created.code);

      expect(organization).not.toBeNull();
      expect(organization?.type).toBe('company');
    });
  });

  describe('createOrganization', () => {
    it('should create a new organization and return it', async () => {
      const testData = createTestOrganizationData();

      const organization = await createOrganization(testData);

      expect(organization.id).toBeGreaterThan(0);
      expect(organization.name).toBe(testData.name);
      expect(organization.code).toMatch(/^[A-Z0-9]{6}$/); // Code is auto-generated, verify format
      expect(organization.type).toBe(testData.type);
      expect(organization.description).toBe(testData.description);
      expect(organization.created).toBeInstanceOf(Date);
    });

    it('should generate unique codes for multiple organizations', async () => {
      const testData = createTestOrganizationData();
      const organization1 = await createOrganization(testData);
      const organization2 = await createOrganization(testData);

      // Codes should be different (auto-generated)
      expect(organization1.code).not.toBe(organization2.code);
      expect(organization1.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(organization2.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(organization1.type).toBe(testData.type);
      expect(organization2.type).toBe(testData.type);
    });

    it('should persist company organization type', async () => {
      const organization = await createOrganization(
        createTestOrganizationData({ type: 'company' })
      );

      expect(organization.type).toBe('company');
    });

    it('should create organization with default payLaterEnabled and menuDayOfWeek', async () => {
      const organization = await createOrganization(createTestOrganizationData());

      expect(organization.payLaterEnabled).toBe(true);
      expect(organization.menuDayOfWeek).toEqual(DEFAULT_DAYS);
    });

    it('should create organization with payLaterEnabled false', async () => {
      const organization = await createOrganization({
        ...createTestOrganizationData(),
        payLaterEnabled: false,
      });

      expect(organization.payLaterEnabled).toBe(false);
      expect(organization.menuDayOfWeek).toEqual(DEFAULT_DAYS);
    });

    it('should create organization with custom menuDayOfWeek', async () => {
      const customDays = [0, 1, 3, 4]; // Mon, Tue, Thu, Fri
      const organization = await createOrganization({
        ...createTestOrganizationData(),
        menuDayOfWeek: customDays,
      });

      expect(organization.payLaterEnabled).toBe(true);
      expect(organization.menuDayOfWeek).toEqual([0, 1, 3, 4]);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization name', async () => {
      const created = await createOrganization(createTestOrganizationData());
      const newName = 'Updated Organization Name';

      const updated = await updateOrganization(created.id, { name: newName });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(newName);
      expect(updated.code).toBe(created.code);
      expect(updated.description).toBe(created.description);
    });

    it('should update organization description', async () => {
      const created = await createOrganization(createTestOrganizationData());
      const newDescription = 'Updated description';

      const updated = await updateOrganization(created.id, { description: newDescription });

      expect(updated.id).toBe(created.id);
      expect(updated.description).toBe(newDescription);
    });

    it('should update organization type', async () => {
      const created = await createOrganization(createTestOrganizationData());

      const updated = await updateOrganization(created.id, { type: 'company' });

      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe('company');
    });

    it('should update organization type back to school', async () => {
      const created = await createOrganization(
        createTestOrganizationData({ type: 'company' })
      );

      const updated = await updateOrganization(created.id, { type: 'school' });

      expect(updated.id).toBe(created.id);
      expect(updated.type).toBe('school');
    });

    it('should update multiple fields at once', async () => {
      const created = await createOrganization(createTestOrganizationData());
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const updated = await updateOrganization(created.id, updates);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(updates.name);
      expect(updated.code).toBe(created.code); // Code should remain unchanged
      expect(updated.type).toBe(created.type);
      expect(updated.description).toBe(updates.description);
    });

    it('should return unchanged organization when no updates provided', async () => {
      const created = await createOrganization(createTestOrganizationData());

      const updated = await updateOrganization(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe(created.name);
      expect(updated.code).toBe(created.code);
      expect(updated.type).toBe(created.type);
      expect(updated.description).toBe(created.description);
    });

    it('should throw error when organization does not exist', async () => {
      await expect(updateOrganization(99999, { name: 'Test' })).rejects.toThrow('Organization not found');
    });

    it('should update payLaterEnabled', async () => {
      const created = await createOrganization(createTestOrganizationData());

      const updated = await updateOrganization(created.id, { payLaterEnabled: false });

      expect(updated.payLaterEnabled).toBe(false);
      const refetched = await getOrganizationById(created.id);
      expect(refetched?.payLaterEnabled).toBe(false);
    });

    it('should update menuDayOfWeek', async () => {
      const created = await createOrganization(createTestOrganizationData());
      const customDays = [0, 1, 2, 3]; // Mon–Thu

      const updated = await updateOrganization(created.id, { menuDayOfWeek: customDays });

      expect(updated.menuDayOfWeek).toEqual([0, 1, 2, 3]);
      const refetched = await getOrganizationById(created.id);
      expect(refetched?.menuDayOfWeek).toEqual([0, 1, 2, 3]);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete an existing organization', async () => {
      const created = await createOrganization(createTestOrganizationData());

      await deleteOrganization(created.id);

      const organization = await getOrganizationById(created.id);
      expect(organization).toBeNull();
    });

    it('should throw error when organization does not exist', async () => {
      await expect(deleteOrganization(99999)).rejects.toThrow('Organization not found');
    });

    it('should allow creating organization after deletion', async () => {
      const testData = createTestOrganizationData();
      const created = await createOrganization(testData);

      await deleteOrganization(created.id);

      // Should be able to create a new organization after deletion
      const newOrganization = await createOrganization(testData);
      expect(newOrganization.id).toBeGreaterThan(0);
      expect(newOrganization.name).toBe(testData.name);
      expect(newOrganization.code).toMatch(/^[A-Z0-9]{6}$/); // Code is auto-generated
      expect(newOrganization.type).toBe(testData.type);
    });
  });
});
