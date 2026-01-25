-- Migration: Add status column to bookings table
-- Description: Adds status column to track payment status of bookings

-- Add status column with default value 'PENDING'
ALTER TABLE bookings ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

-- Add index on status for filtering queries
CREATE INDEX idx_status ON bookings (status);
