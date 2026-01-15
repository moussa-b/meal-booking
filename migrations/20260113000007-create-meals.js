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
  db.runSql('CREATE TABLE IF NOT EXISTS meals (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  name VARCHAR(255) NOT NULL,\n  type VARCHAR(255) NOT NULL,\n  description TEXT NOT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS meals;', callback);
};

exports._meta = {
  "version": 1
};
