-- Migration: Add pay_later_enabled and menu_day_of_week to organizations table
-- Description: Pay later button toggle per org; which weekdays have a menu (0-6 = Lundi-Dimanche)

ALTER TABLE organizations ADD COLUMN pay_later_enabled TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE organizations ADD COLUMN menu_day_of_week JSON NULL;
UPDATE organizations SET menu_day_of_week = CAST('[0,1,2,3,4,5,6]' AS JSON) WHERE menu_day_of_week IS NULL;
ALTER TABLE organizations MODIFY COLUMN menu_day_of_week JSON NOT NULL;
