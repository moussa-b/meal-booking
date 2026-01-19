-- Migration: Remove schoolId from weekly_menus table
-- Description: Removes schoolId column, foreign key, and unique constraint, restores old unique constraint

-- Drop index on schoolId
ALTER TABLE weekly_menus DROP INDEX idx_school_id;

-- Drop unique constraint on (schoolId, weekStartDate)
-- Note: In MySQL, unique constraints are implemented as indexes
ALTER TABLE weekly_menus DROP INDEX unique_school_week_start;

-- Drop foreign key constraint
ALTER TABLE weekly_menus DROP FOREIGN KEY fk_weekly_menus_school;

-- Drop schoolId column
ALTER TABLE weekly_menus DROP COLUMN schoolId;

-- Restore the old unique constraint on weekStartDate
ALTER TABLE weekly_menus ADD CONSTRAINT unique_week_start UNIQUE (weekStartDate);
