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
  db.runSql('ALTER TABLE students ADD COLUMN parentEmail VARCHAR(255) NULL;', function(err) {
    if (err) return callback(err);
    
    db.runSql('CREATE INDEX idx_parent_email ON students (parentEmail);', function(err) {
      if (err) return callback(err);
      
      db.runSql('CREATE TABLE IF NOT EXISTS bookings (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  email VARCHAR(255) NOT NULL,\n  schoolId INT NOT NULL,\n  menuId INT NOT NULL,\n  FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT,\n  FOREIGN KEY (menuId) REFERENCES weekly_menus(id) ON DELETE RESTRICT,\n  INDEX idx_email (email),\n  INDEX idx_school_id (schoolId),\n  INDEX idx_menu_id (menuId),\n  INDEX idx_created (created)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', function(err) {
        if (err) return callback(err);
        
        db.runSql('CREATE TABLE IF NOT EXISTS booking_students (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  bookingId INT NOT NULL,\n  studentId INT NULL,\n  lastName VARCHAR(255) NOT NULL,\n  firstName VARCHAR(255) NOT NULL,\n  class VARCHAR(100) NOT NULL,\n  feedingRegime VARCHAR(255) NULL,\n  parentEmail VARCHAR(255) NOT NULL,\n  FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,\n  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL,\n  INDEX idx_booking_id (bookingId),\n  INDEX idx_student_id (studentId),\n  INDEX idx_parent_email (parentEmail)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', function(err) {
          if (err) return callback(err);
          
          db.runSql('CREATE TABLE IF NOT EXISTS booking_menu_selections (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  bookingId INT NOT NULL,\n  bookingStudentId INT NOT NULL,\n  weeklyMenuDayId INT NOT NULL,\n  FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE,\n  FOREIGN KEY (bookingStudentId) REFERENCES booking_students(id) ON DELETE CASCADE,\n  FOREIGN KEY (weeklyMenuDayId) REFERENCES weekly_menu_days(id) ON DELETE RESTRICT,\n  INDEX idx_booking_id (bookingId),\n  INDEX idx_booking_student_id (bookingStudentId),\n  INDEX idx_weekly_menu_day_id (weeklyMenuDayId)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;', callback);
        });
      });
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS booking_menu_selections;', function(err) {
    if (err) return callback(err);
    
    db.runSql('DROP TABLE IF EXISTS booking_students;', function(err) {
      if (err) return callback(err);
      
      db.runSql('DROP TABLE IF EXISTS bookings;', function(err) {
        if (err) return callback(err);
        
        db.runSql('ALTER TABLE students DROP INDEX idx_parent_email;', function(err) {
          if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
            return callback(err);
          }
          
          db.runSql('ALTER TABLE students DROP COLUMN parentEmail;', callback);
        });
      });
    });
  });
};

exports._meta = {
  "version": 1
};
