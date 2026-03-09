-- Migration: Rename schools schema to organizations
-- Description: Renames the schools table to organizations and updates related columns, indexes, and foreign keys

ALTER TABLE bookings DROP FOREIGN KEY bookings_ibfk_1;
ALTER TABLE weekly_menus DROP FOREIGN KEY fk_weekly_menus_school;

ALTER TABLE bookings DROP INDEX idx_school_id;
ALTER TABLE weekly_menus DROP INDEX unique_school_week_start;
ALTER TABLE weekly_menus DROP INDEX idx_school_id;

RENAME TABLE schools TO organizations;

ALTER TABLE bookings CHANGE COLUMN schoolId organizationId INT NOT NULL;
ALTER TABLE weekly_menus CHANGE COLUMN schoolId organizationId INT NOT NULL;

CREATE INDEX idx_organization_id ON bookings (organizationId);
ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_organization
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE RESTRICT;

ALTER TABLE weekly_menus
  ADD CONSTRAINT unique_organization_week_start
  UNIQUE (organizationId, weekStartDate);
CREATE INDEX idx_organization_id ON weekly_menus (organizationId);
ALTER TABLE weekly_menus
  ADD CONSTRAINT fk_weekly_menus_organization
  FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE RESTRICT;
