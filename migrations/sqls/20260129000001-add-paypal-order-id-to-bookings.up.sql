-- Migration: Add paypalOrderId to bookings table
-- Description: Stores PayPal order ID for reuse and retry (e.g. after capture failure)

ALTER TABLE bookings ADD COLUMN paypalOrderId VARCHAR(255) NULL;
CREATE INDEX idx_paypalOrderId ON bookings (paypalOrderId);
