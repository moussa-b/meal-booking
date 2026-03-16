import { type MysqlDeleteResult, type MysqlInsertResult, query } from '@/lib/db/connection';
import type { Organization, OrganizationType } from '@/lib/models/organization';
import { DEFAULT_DAYS } from '@/lib/utils/date.utils';

/**
 * Database row type for Organization (as returned from MySQL)
 */
interface OrganizationRow {
  id: number;
  created: string | Date;
  name: string;
  code: string;
  type: string | null;
  description: string | null;
  pay_later_enabled: number | boolean;
  menu_day_of_week: string | unknown;
}

function normalizeOrganizationType(type: string | null): OrganizationType {
  return type === 'company' ? 'company' : 'school';
}

function parseMenuDayOfWeek(value: string | unknown): number[] {
  if (value == null) return [...DEFAULT_DAYS];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) && parsed.every((n) => typeof n === 'number')
        ? [...parsed].sort((a, b) => a - b)
        : [...DEFAULT_DAYS];
    } catch {
      return [...DEFAULT_DAYS];
    }
  }
  if (Array.isArray(value) && value.every((n) => typeof n === 'number')) {
    return [...value].sort((a, b) => a - b);
  }
  return [...DEFAULT_DAYS];
}

function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id,
    created: new Date(row.created),
    name: row.name,
    code: row.code,
    type: normalizeOrganizationType(row.type),
    description: row.description || '',
    payLaterEnabled: Boolean(row.pay_later_enabled),
    menuDayOfWeek: parseMenuDayOfWeek(row.menu_day_of_week),
  };
}

/**
 * Get all organizations
 */
export async function getAllOrganizations(): Promise<Organization[]> {
  const results = await query<OrganizationRow[]>(
    'SELECT id, created, name, code, type, description, pay_later_enabled, menu_day_of_week FROM organizations ORDER BY created DESC'
  );
  return results.map(mapOrganizationRow).sort((a: Organization, b: Organization) => a.name.localeCompare(b.name));
}

/**
 * Get an organization by ID
 */
export async function getOrganizationById(id: number): Promise<Organization | null> {
  const results = await query<OrganizationRow[]>(
    'SELECT id, created, name, code, type, description, pay_later_enabled, menu_day_of_week FROM organizations WHERE id = ?',
    [id]
  );

  if (results.length === 0) {
    return null;
  }

  return mapOrganizationRow(results[0]);
}

/**
 * Get an organization by code
 */
export async function getOrganizationByCode(code: string): Promise<Organization | null> {
  const results = await query<OrganizationRow[]>(
    'SELECT id, created, name, code, type, description, pay_later_enabled, menu_day_of_week FROM organizations WHERE code = ?',
    [code]
  );

  if (results.length === 0) {
    return null;
  }

  return mapOrganizationRow(results[0]);
}

/**
 * Generate a random 6-character code containing numbers and letters
 */
function generateOrganizationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new organization
 * The code is automatically generated on the server side
 */
export async function createOrganization(data: {
  name: string;
  type: OrganizationType;
  description?: string;
  payLaterEnabled?: boolean;
  menuDayOfWeek?: number[];
}): Promise<Organization> {
  // Fetch all existing codes once at the beginning
  const existingOrganizations = await query<OrganizationRow[]>(
    'SELECT code FROM organizations'
  );
  const existingCodes = new Set(existingOrganizations.map((row: OrganizationRow) => row.code));

  // Generate a unique code
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateOrganizationCode();
    // Check if code already exists in the set
    if (!existingCodes.has(code)) {
      break; // Code is unique
    }

    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique organization code');
    }
  } while (true);

  const payLaterEnabled = data.payLaterEnabled !== false ? 1 : 0;
  const menuDayOfWeekJson = JSON.stringify(
    (data.menuDayOfWeek != null && data.menuDayOfWeek.length > 0)
      ? [...data.menuDayOfWeek].sort((a, b) => a - b)
      : DEFAULT_DAYS
  );

  const result = await query<MysqlInsertResult>(
    'INSERT INTO organizations (name, code, type, description, pay_later_enabled, menu_day_of_week) VALUES (?, ?, ?, ?, ?, CAST(? AS JSON))',
    [data.name, code, data.type, data.description || null, payLaterEnabled, menuDayOfWeekJson]
  );

  const insertedId: number = result.insertId;
  const organization = await getOrganizationById(insertedId);

  if (!organization) {
    throw new Error('Failed to retrieve created organization');
  }

  return organization;
}

/**
 * Update an organization
 * Note: code cannot be updated as it is auto-generated and readonly
 */
export async function updateOrganization(
  id: number,
  data: {
    name?: string;
    type?: OrganizationType;
    description?: string;
    payLaterEnabled?: boolean;
    menuDayOfWeek?: number[];
  }
): Promise<Organization> {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description || null);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.payLaterEnabled !== undefined) {
    updates.push('pay_later_enabled = ?');
    values.push(data.payLaterEnabled ? 1 : 0);
  }
  if (data.menuDayOfWeek !== undefined) {
    updates.push('menu_day_of_week = CAST(? AS JSON)');
    values.push(
      data.menuDayOfWeek.length > 0
        ? JSON.stringify([...data.menuDayOfWeek].sort((a, b) => a - b))
        : JSON.stringify(DEFAULT_DAYS)
    );
  }

  if (updates.length === 0) {
    const organization = await getOrganizationById(id);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  values.push(id);
  await query(
    `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const organization = await getOrganizationById(id);
  if (!organization) {
    throw new Error('Organization not found');
  }

  return organization;
}

/**
 * Delete an organization
 */
export async function deleteOrganization(id: number): Promise<void> {
  const result = await query<MysqlDeleteResult>(
    'DELETE FROM organizations WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Organization not found');
  }
}
