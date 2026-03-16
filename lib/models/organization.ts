export const ORGANIZATION_TYPES = ['school', 'company'] as const;
export type OrganizationType = typeof ORGANIZATION_TYPES[number];

/**
 * Organization model interface
 * Represents an organization in the system
 */
export interface Organization {
  id: number;
  created: Date;
  name: string;
  code: string;
  type: OrganizationType;
  description: string;
  payLaterEnabled: boolean;
  menuDayOfWeek: number[]; //Weekdays that have a menu (0 = Lundi … 6 = Dimanche). Must be sorted and unique.
}
