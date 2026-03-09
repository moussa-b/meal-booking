-- Migration: Rename meal_participants back to students and drop type fields
-- Description: Reverts the meal participant schema rename and removes added type columns

ALTER TABLE booking_menu_selections DROP FOREIGN KEY fk_booking_menu_selections_booking_meal_participant;
ALTER TABLE booking_meal_participants DROP FOREIGN KEY fk_booking_meal_participants_meal_participant;
ALTER TABLE booking_menu_selections CHANGE COLUMN bookingMealParticipantId bookingStudentId INT NOT NULL;
ALTER TABLE booking_menu_selections RENAME INDEX idx_booking_meal_participant_id TO idx_booking_student_id;
ALTER TABLE booking_meal_participants RENAME INDEX idx_meal_participant_id TO idx_student_id;
ALTER TABLE booking_meal_participants CHANGE COLUMN mealParticipantId studentId INT NULL;
ALTER TABLE booking_meal_participants DROP COLUMN type;
ALTER TABLE meal_participants DROP COLUMN type;
RENAME TABLE booking_meal_participants TO booking_students;
RENAME TABLE meal_participants TO students;
ALTER TABLE booking_students ADD CONSTRAINT booking_students_ibfk_2 FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL;
ALTER TABLE booking_menu_selections ADD CONSTRAINT booking_menu_selections_ibfk_2 FOREIGN KEY (bookingStudentId) REFERENCES booking_students(id) ON DELETE CASCADE;
