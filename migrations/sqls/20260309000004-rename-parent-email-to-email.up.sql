-- Migration: Rename parentEmail to email
-- Description: Renames participant email columns and indexes to use the email field name consistently

ALTER TABLE meal_participants CHANGE COLUMN parentEmail email VARCHAR(255) NULL;
ALTER TABLE meal_participants RENAME INDEX idx_parent_email TO idx_email;

ALTER TABLE booking_meal_participants CHANGE COLUMN parentEmail email VARCHAR(255) NOT NULL;
ALTER TABLE booking_meal_participants RENAME INDEX idx_parent_email TO idx_email;
