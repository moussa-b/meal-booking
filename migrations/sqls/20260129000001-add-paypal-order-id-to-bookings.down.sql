-- Rollback: Remove paypalOrderId from bookings table

DROP INDEX idx_paypalOrderId ON bookings;
ALTER TABLE bookings DROP COLUMN paypalOrderId;
