-- Migration: Rename students to meal_participants and add type fields
-- Description: Renames student-related tables and columns and adds a type column aligned with organizations

ALTER TABLE booking_menu_selections DROP FOREIGN KEY booking_menu_selections_ibfk_2;
ALTER TABLE booking_students DROP FOREIGN KEY booking_students_ibfk_2;
RENAME TABLE students TO meal_participants;
RENAME TABLE booking_students TO booking_meal_participants;
ALTER TABLE meal_participants ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'school' AFTER class;
ALTER TABLE booking_meal_participants CHANGE COLUMN studentId mealParticipantId INT NULL;
ALTER TABLE booking_meal_participants ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'school' AFTER class;
ALTER TABLE booking_menu_selections CHANGE COLUMN bookingStudentId bookingMealParticipantId INT NOT NULL;
ALTER TABLE booking_meal_participants RENAME INDEX idx_student_id TO idx_meal_participant_id;
ALTER TABLE booking_menu_selections RENAME INDEX idx_booking_student_id TO idx_booking_meal_participant_id;
ALTER TABLE booking_meal_participants ADD CONSTRAINT fk_booking_meal_participants_meal_participant FOREIGN KEY (mealParticipantId) REFERENCES meal_participants(id) ON DELETE SET NULL;
ALTER TABLE booking_menu_selections ADD CONSTRAINT fk_booking_menu_selections_booking_meal_participant FOREIGN KEY (bookingMealParticipantId) REFERENCES booking_meal_participants(id) ON DELETE CASCADE;
