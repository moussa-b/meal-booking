-- Migration: Remove pay_later_enabled and menu_day_of_week from organizations table

ALTER TABLE organizations DROP COLUMN pay_later_enabled;
ALTER TABLE organizations DROP COLUMN menu_day_of_week;
