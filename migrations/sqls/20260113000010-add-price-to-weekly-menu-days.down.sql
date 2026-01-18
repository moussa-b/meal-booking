-- Migration: Remove price column from weekly_menu_days table
-- Description: Removes the price column from the weekly_menu_days table

ALTER TABLE weekly_menu_days DROP COLUMN price;
