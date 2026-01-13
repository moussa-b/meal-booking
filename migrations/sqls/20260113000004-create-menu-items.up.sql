-- Migration: Create menu_items table
-- Description: Creates the menu_items table for storing menu item details

CREATE TABLE IF NOT EXISTS menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mainDish VARCHAR(255) NOT NULL,
  sideDish VARCHAR(255) NOT NULL,
  dessert VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
