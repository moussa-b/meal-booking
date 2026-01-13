-- Migration: Drop menu_items table
-- Description: Drops the menu_items table (rollback for create-menu-items)
-- Note: day_menus table must be dropped first due to foreign key constraint

DROP TABLE IF EXISTS menu_items;
