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
  db.runSql(
    "ALTER TABLE bookings " +
    "ADD COLUMN phone VARCHAR(50) NULL AFTER email, " +
    "ADD COLUMN comment MEDIUMTEXT NULL AFTER status;",
    function(err) {
      if (err) return callback(err);
      db.runSql(
        "ALTER TABLE meal_participants " +
        "ADD COLUMN phone VARCHAR(50) NULL AFTER email;",
        function(err) {
          if (err) return callback(err);
          db.runSql(
            "ALTER TABLE booking_meal_participants " +
            "ADD COLUMN phone VARCHAR(50) NULL AFTER email;",
            callback
          );
        }
      );
    }
  );
};

exports.down = function(db, callback) {
  db.runSql(
    "ALTER TABLE booking_meal_participants " +
    "DROP COLUMN phone;",
    function(err) {
      if (err) return callback(err);
      db.runSql(
        "ALTER TABLE meal_participants " +
        "DROP COLUMN phone;",
        function(err) {
          if (err) return callback(err);
          db.runSql(
            "ALTER TABLE bookings " +
            "DROP COLUMN comment, " +
            "DROP COLUMN phone;",
            callback
          );
        }
      );
    }
  );
};

exports._meta = {
  "version": 1
};

