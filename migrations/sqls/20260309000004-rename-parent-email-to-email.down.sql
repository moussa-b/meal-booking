-- Rollback: Rename email back to parentEmail

ALTER TABLE booking_meal_participants CHANGE COLUMN email parentEmail VARCHAR(255) NOT NULL;
ALTER TABLE booking_meal_participants RENAME INDEX idx_email TO idx_parent_email;

ALTER TABLE meal_participants CHANGE COLUMN email parentEmail VARCHAR(255) NULL;
ALTER TABLE meal_participants RENAME INDEX idx_email TO idx_parent_email;
