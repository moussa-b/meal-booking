-- Rollback: Remove paymentEmailSentAt and confirmationEmailSentAt from bookings table

ALTER TABLE bookings DROP COLUMN paymentEmailSentAt;
ALTER TABLE bookings DROP COLUMN confirmationEmailSentAt;
