'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.runSql('CREATE TABLE IF NOT EXISTS weekly_menu_days (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  weeklyMenuId INT NOT NULL,\n  dayOfWeek TINYINT NOT NULL,\n  mainDishId INT NOT NULL,\n  appetizerId INT NULL,\n  dessertId INT NULL,\n  FOREIGN KEY (weeklyMenuId) REFERENCES weekly_menus(id) ON DELETE CASCADE,\n  FOREIGN KEY (mainDishId) REFERENCES meals(id) ON DELETE RESTRICT,\n  FOREIGN KEY (appetizerId) REFERENCES meals(id) ON DELETE SET NULL,\n  FOREIGN KEY (dessertId) REFERENCES meals(id) ON DELETE SET NULL,\n  INDEX idx_weekly_menu (weeklyMenuId),\n  INDEX idx_day_of_week (dayOfWeek),\n  UNIQUE KEY unique_menu_day (weeklyMenuId, dayOfWeek)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS weekly_menu_days;', callback);
};

exports._meta = {
  "version": 1
};
