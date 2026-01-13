/**
 * MenuItem model interface
 * Represents a menu item with main dish, side dish, and dessert
 */
export interface MenuItem {
  id: number;
  created: Date;
  mainDish: string;
  sideDish: string;
  dessert: string;
}
