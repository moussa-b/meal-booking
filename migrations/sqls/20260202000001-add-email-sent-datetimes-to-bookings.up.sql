-- Migration: Add paymentEmailSentAt and confirmationEmailSentAt to bookings table
-- Description: Datetime columns to track when payment (pay-later) and confirmation emails were sent

ALTER TABLE bookings ADD COLUMN paymentEmailSentAt DATETIME NULL;
ALTER TABLE bookings ADD COLUMN confirmationEmailSentAt DATETIME NULL;
