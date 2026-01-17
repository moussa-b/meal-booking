-- Migration: Create weekly_menu_days table
-- Description: Creates the weekly_menu_days table for storing daily meal composition within weekly menus

CREATE TABLE IF NOT EXISTS weekly_menu_days (
  id INT PRIMARY KEY AUTO_INCREMENT,
  weeklyMenuId INT NOT NULL,
  dayOfWeek TINYINT NOT NULL,
  mainDishId INT NOT NULL,
  appetizerId INT NULL,
  dessertId INT NULL,
  FOREIGN KEY (weeklyMenuId) REFERENCES weekly_menus(id) ON DELETE CASCADE,
  FOREIGN KEY (mainDishId) REFERENCES meals(id) ON DELETE RESTRICT,
  FOREIGN KEY (appetizerId) REFERENCES meals(id) ON DELETE SET NULL,
  FOREIGN KEY (dessertId) REFERENCES meals(id) ON DELETE SET NULL,
  INDEX idx_weekly_menu (weeklyMenuId),
  INDEX idx_day_of_week (dayOfWeek),
  UNIQUE KEY unique_menu_day (weeklyMenuId, dayOfWeek)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
