import { MenuItem } from './menu-item';

/**
 * DayMenu model interface
 * Represents a menu for a specific day
 */
export interface DayMenu {
  id: number;
  created: Date;
  day: string;
  date: string;
  menu: MenuItem;
}
