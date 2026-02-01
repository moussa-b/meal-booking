-- Migration: Recreate day_menus table (rollback for drop-day-menus)
-- Description: Recreates the day_menus table

CREATE TABLE IF NOT EXISTS day_menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  day VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  menuItemId INT NOT NULL,
  FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE,
  INDEX idx_date (date),
  INDEX idx_day (day),
  UNIQUE KEY unique_date_menu (date, menuItemId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
