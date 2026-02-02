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
  db.runSql('ALTER TABLE bookings ADD COLUMN paymentEmailSentAt DATETIME NULL;', function(err) {
    if (err) return callback(err);
    db.runSql('ALTER TABLE bookings ADD COLUMN confirmationEmailSentAt DATETIME NULL;', callback);
  });
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE bookings DROP COLUMN paymentEmailSentAt;', function(err) {
    if (err) return callback(err);
    db.runSql('ALTER TABLE bookings DROP COLUMN confirmationEmailSentAt;', callback);
  });
};

exports._meta = {
  "version": 1
};
