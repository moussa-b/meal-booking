-- Migration: Drop bookings tables
-- Description: Drops the bookings, booking_students, and booking_menu_selections tables, and removes parentEmail from students

-- Drop booking_menu_selections table
DROP TABLE IF EXISTS booking_menu_selections;

-- Drop booking_students table
DROP TABLE IF EXISTS booking_students;

-- Drop bookings table
DROP TABLE IF EXISTS bookings;

-- Remove parentEmail column from students table
ALTER TABLE students DROP INDEX idx_parent_email;
ALTER TABLE students DROP COLUMN parentEmail;
