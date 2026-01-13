-- Migration: Drop booking_submissions table
-- Description: Drops the booking_submissions table (rollback for create-booking-submissions)

DROP TABLE IF EXISTS booking_submissions;
