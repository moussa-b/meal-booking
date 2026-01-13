-- Migration: Create booking_submissions table
-- Description: Creates the booking_submissions table for storing meal booking submissions

CREATE TABLE IF NOT EXISTS booking_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  schoolCode VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  saveChildrenInfo BOOLEAN NOT NULL DEFAULT FALSE,
  children JSON NOT NULL,
  menuSelections JSON NOT NULL,
  INDEX idx_school_code (schoolCode),
  INDEX idx_email (email),
  INDEX idx_created (created)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
