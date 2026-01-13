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
  db.runSql('CREATE TABLE IF NOT EXISTS booking_submissions (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  schoolCode VARCHAR(100) NOT NULL,\n  email VARCHAR(255) NOT NULL,\n  saveChildrenInfo BOOLEAN NOT NULL DEFAULT FALSE,\n  children JSON NOT NULL,\n  menuSelections JSON NOT NULL,\n  INDEX idx_school_code (schoolCode),\n  INDEX idx_email (email),\n  INDEX idx_created (created)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS booking_submissions;', callback);
};

exports._meta = {
  "version": 1
};
