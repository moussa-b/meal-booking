-- Migration: Create meals table
-- Description: Creates the meals table for storing meal items

CREATE TABLE IF NOT EXISTS meals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  description TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
