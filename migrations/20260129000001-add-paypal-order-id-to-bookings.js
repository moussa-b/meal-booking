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
  db.runSql('ALTER TABLE bookings ADD COLUMN paypalOrderId VARCHAR(255) NULL;', function(err) {
    if (err) return callback(err);
    db.runSql('CREATE INDEX idx_paypalOrderId ON bookings (paypalOrderId);', callback);
  });
};

exports.down = function(db, callback) {
  db.runSql('DROP INDEX idx_paypalOrderId ON bookings;', function(err) {
    if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
      return callback(err);
    }
    db.runSql('ALTER TABLE bookings DROP COLUMN paypalOrderId;', callback);
  });
};

exports._meta = {
  "version": 1
};
