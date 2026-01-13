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
  db.runSql('CREATE TABLE IF NOT EXISTS menu_items (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  mainDish VARCHAR(255) NOT NULL,\n  sideDish VARCHAR(255) NOT NULL,\n  dessert VARCHAR(255) NOT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS menu_items;', callback);
};

exports._meta = {
  "version": 1
};
