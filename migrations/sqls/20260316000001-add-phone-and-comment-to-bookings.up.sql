-- Migration: Add phone and comment to booking-related tables
-- Description: Adds phone column to bookings, meal_participants, booking_meal_participants
--              and a comment column to bookings.

ALTER TABLE bookings
  ADD COLUMN phone VARCHAR(50) NULL AFTER email,
  ADD COLUMN comment MEDIUMTEXT NULL AFTER status;

ALTER TABLE meal_participants
  ADD COLUMN phone VARCHAR(50) NULL AFTER email;

ALTER TABLE booking_meal_participants
  ADD COLUMN phone VARCHAR(50) NULL AFTER email;

