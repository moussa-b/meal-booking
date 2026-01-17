-- Migration: Create weekly_menus table
-- Description: Creates the weekly_menus table for storing weekly menu information

CREATE TABLE IF NOT EXISTS weekly_menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  weekStartDate DATE NOT NULL,
  weekNumber INT,
  year INT,
  INDEX idx_week_start (weekStartDate),
  UNIQUE KEY unique_week_start (weekStartDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
