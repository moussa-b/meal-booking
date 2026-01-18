-- Migration: Add price column to weekly_menu_days table
-- Description: Adds a price column (DOUBLE) to the weekly_menu_days table with NOT NULL constraint and default value of 0.0

ALTER TABLE weekly_menu_days ADD COLUMN price DOUBLE NOT NULL DEFAULT 0.0;
