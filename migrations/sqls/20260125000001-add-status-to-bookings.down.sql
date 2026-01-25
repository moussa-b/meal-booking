-- Migration: Remove status column from bookings table
-- Description: Removes status column and its index

-- Drop index on status
DROP INDEX idx_status ON bookings;

-- Drop status column
ALTER TABLE bookings DROP COLUMN status;
