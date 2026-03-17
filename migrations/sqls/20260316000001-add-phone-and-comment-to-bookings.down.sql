-- Rollback: Remove phone and comment from booking-related tables

ALTER TABLE booking_meal_participants
  DROP COLUMN phone;

ALTER TABLE meal_participants
  DROP COLUMN phone;

ALTER TABLE bookings
  DROP COLUMN comment,
  DROP COLUMN phone;

