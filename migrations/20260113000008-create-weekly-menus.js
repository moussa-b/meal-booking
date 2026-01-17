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
  db.runSql('CREATE TABLE IF NOT EXISTS weekly_menus (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  weekStartDate DATE NOT NULL,\n  weekNumber INT,\n  year INT,\n  INDEX idx_week_start (weekStartDate),\n  UNIQUE KEY unique_week_start (weekStartDate)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS weekly_menus;', callback);
};

exports._meta = {
  "version": 1
};
