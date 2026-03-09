-- Migration: Rename organizations schema back to schools
-- Description: Reverts organizations table and related columns, indexes, and foreign keys back to schools naming

ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_organization;
ALTER TABLE weekly_menus DROP FOREIGN KEY fk_weekly_menus_organization;

ALTER TABLE bookings DROP INDEX idx_organization_id;
ALTER TABLE weekly_menus DROP INDEX unique_organization_week_start;
ALTER TABLE weekly_menus DROP INDEX idx_organization_id;

ALTER TABLE bookings CHANGE COLUMN organizationId schoolId INT NOT NULL;
ALTER TABLE weekly_menus CHANGE COLUMN organizationId schoolId INT NOT NULL;

RENAME TABLE organizations TO schools;

CREATE INDEX idx_school_id ON bookings (schoolId);
ALTER TABLE bookings
  ADD CONSTRAINT bookings_ibfk_1
  FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;

ALTER TABLE weekly_menus
  ADD CONSTRAINT unique_school_week_start
  UNIQUE (schoolId, weekStartDate);
CREATE INDEX idx_school_id ON weekly_menus (schoolId);
ALTER TABLE weekly_menus
  ADD CONSTRAINT fk_weekly_menus_school
  FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;
