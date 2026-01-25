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
  // Add status column with default value 'PENDING'
  db.runSql('ALTER TABLE bookings ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT \'PENDING\';', function(err) {
    if (err) return callback(err);
    
    // Add index on status for filtering queries
    db.runSql('CREATE INDEX idx_status ON bookings (status);', callback);
  });
};

exports.down = function(db, callback) {
  // Drop index on status (ignore error if it doesn't exist)
  db.runSql('DROP INDEX idx_status ON bookings;', function(err) {
    if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
      return callback(err);
    }
    
    // Drop status column
    db.runSql('ALTER TABLE bookings DROP COLUMN status;', callback);
  });
};

exports._meta = {
  "version": 1
};
