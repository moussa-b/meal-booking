'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.runSql('ALTER TABLE meal_participants CHANGE COLUMN parentEmail email VARCHAR(255) NULL;', function(err) {
    if (err) return callback(err);
    db.runSql('ALTER TABLE meal_participants RENAME INDEX idx_parent_email TO idx_email;', function(err) {
      if (err) return callback(err);
      db.runSql('ALTER TABLE booking_meal_participants CHANGE COLUMN parentEmail email VARCHAR(255) NOT NULL;', function(err) {
        if (err) return callback(err);
        db.runSql('ALTER TABLE booking_meal_participants RENAME INDEX idx_parent_email TO idx_email;', callback);
      });
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE booking_meal_participants CHANGE COLUMN email parentEmail VARCHAR(255) NOT NULL;', function(err) {
    if (err) return callback(err);
    db.runSql('ALTER TABLE booking_meal_participants RENAME INDEX idx_email TO idx_parent_email;', function(err) {
      if (err) return callback(err);
      db.runSql('ALTER TABLE meal_participants CHANGE COLUMN email parentEmail VARCHAR(255) NULL;', function(err) {
        if (err) return callback(err);
        db.runSql('ALTER TABLE meal_participants RENAME INDEX idx_email TO idx_parent_email;', callback);
      });
    });
  });
};

exports._meta = {
  "version": 1
};
