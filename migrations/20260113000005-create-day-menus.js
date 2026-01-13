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
  db.runSql('CREATE TABLE IF NOT EXISTS day_menus (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  day VARCHAR(50) NOT NULL,\n  date DATE NOT NULL,\n  menuItemId INT NOT NULL,\n  FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE,\n  INDEX idx_date (date),\n  INDEX idx_day (day),\n  UNIQUE KEY unique_date_menu (date, menuItemId)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS day_menus;', callback);
};

exports._meta = {
  "version": 1
};
