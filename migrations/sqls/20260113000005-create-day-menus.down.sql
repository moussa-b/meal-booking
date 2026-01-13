-- Migration: Drop day_menus table
-- Description: Drops the day_menus table (rollback for create-day-menus)
-- Note: This must be dropped before menu_items due to foreign key constraint

DROP TABLE IF EXISTS day_menus;
