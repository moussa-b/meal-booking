-- Migration: Add schoolId to weekly_menus table and create unique constraint
-- Description: Adds schoolId column, foreign key to schools, and unique constraint on (schoolId, weekStartDate)

-- Drop the old unique constraint on weekStartDate alone
-- Note: In MySQL, unique constraints are implemented as indexes
-- This will fail silently if the index doesn't exist, which is fine
ALTER TABLE weekly_menus DROP INDEX unique_week_start;

-- Get the first school ID to use as default for existing records
-- Note: This assumes at least one school exists. If no schools exist, 
-- the column will be nullable and must be set by the application.

-- Add schoolId column (nullable initially)
ALTER TABLE weekly_menus ADD COLUMN schoolId INT NULL;

-- Update existing records with the first school (if schools exist)
-- This is handled in the JS migration file for dynamic behavior

-- Make schoolId NOT NULL (after updating existing records)
-- This is handled in the JS migration file

-- Add foreign key constraint
ALTER TABLE weekly_menus ADD CONSTRAINT fk_weekly_menus_school 
  FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;

-- Add unique constraint on (schoolId, weekStartDate)
ALTER TABLE weekly_menus ADD CONSTRAINT unique_school_week_start 
  UNIQUE (schoolId, weekStartDate);

-- Add index on schoolId for performance
CREATE INDEX idx_school_id ON weekly_menus (schoolId);
