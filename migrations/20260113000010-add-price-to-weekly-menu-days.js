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
  db.runSql('ALTER TABLE weekly_menu_days ADD COLUMN price DOUBLE NOT NULL DEFAULT 0.0;', callback);
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE weekly_menu_days DROP COLUMN price;', callback);
};

exports._meta = {
  "version": 1
};
