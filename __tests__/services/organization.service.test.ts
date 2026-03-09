import { describe, expect, it } from 'vitest';
import { createOrganization, deleteOrganization, getAllOrganizations, getOrganizationById, getOrganizationByCode, updateOrganization, } from '@/lib/services/organization.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestOrganizationData } from '../helpers/test-data';

// Setup test isolation (clean tables before each test)
setupTestIsolation();

describe('Organization Service', () => {
  describe('getAllOrganizations', () => {
    it('should return empty array when no organizations exist', async () => {
      const organizations = await getAllOrganizations();
      expect(organizations).toEqual([]);
      expect(organizations.length).toBe(0);
    });

    it('should return all organizations ordered by created DESC', async () => {
      // Create test organizations
      const organization1 = await createOrganization(createTestOrganizationData({ name: 'Organization A' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const organization2 = await createOrganization(createTestOrganizationData({ name: 'Organization B' }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      const organization3 = await createOrganization(createTestOrganizationData({ name: 'Organization C' }));

      const organizations = await getAllOrganizations();

      expect(organizations.length).toBe(3);
      // Should be ordered by created DESC (newest first)
      expect(organizations[0].id).toBe(organization3.id);
      expect(organizations[1].id).toBe(organization2.id);
      expect(organizations[2].id).toBe(organization1.id);
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
