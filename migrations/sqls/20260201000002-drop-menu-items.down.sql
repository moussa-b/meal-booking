-- Migration: Recreate menu_items table (rollback for drop-menu-items)
-- Description: Recreates the menu_items table

CREATE TABLE IF NOT EXISTS menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mainDish VARCHAR(255) NOT NULL,
  sideDish VARCHAR(255) NOT NULL,
  dessert VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
