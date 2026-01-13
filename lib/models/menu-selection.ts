/**
 * Menu selection model interface
 * Represents menu selections for specific days of the week
 */
export interface MenuSelection {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}
