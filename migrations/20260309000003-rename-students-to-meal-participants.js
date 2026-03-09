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
  db.runSql('ALTER TABLE booking_menu_selections DROP FOREIGN KEY booking_menu_selections_ibfk_2;', function(err) {
    if (err) return callback(err);
    db.runSql('ALTER TABLE booking_students DROP FOREIGN KEY booking_students_ibfk_2;', function(err) {
      if (err) return callback(err);
      db.runSql('RENAME TABLE students TO meal_participants;', function(err) {
        if (err) return callback(err);
        db.runSql('RENAME TABLE booking_students TO booking_meal_participants;', function(err) {
          if (err) return callback(err);
          db.runSql("ALTER TABLE meal_participants ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'school' AFTER class;", function(err) {
            if (err) return callback(err);
            db.runSql("ALTER TABLE booking_meal_participants CHANGE COLUMN studentId mealParticipantId INT NULL, ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'school' AFTER class;", function(err) {
              if (err) return callback(err);
              db.runSql('ALTER TABLE booking_menu_selections CHANGE COLUMN bookingStudentId bookingMealParticipantId INT NOT NULL;', function(err) {
                if (err) return callback(err);
                db.runSql('ALTER TABLE booking_meal_participants RENAME INDEX idx_student_id TO idx_meal_participant_id;', function(err) {
                  if (err) return callback(err);
                  db.runSql('ALTER TABLE booking_menu_selections RENAME INDEX idx_booking_student_id TO idx_booking_meal_participant_id;', function(err) {
                    if (err) return callback(err);
                    db.runSql('ALTER TABLE booking_meal_participants ADD CONSTRAINT fk_booking_meal_participants_meal_participant FOREIGN KEY (mealParticipantId) REFERENCES meal_participants(id) ON DELETE SET NULL;', function(err) {
                      if (err) return callback(err);
                      db.runSql('ALTER TABLE booking_menu_selections ADD CONSTRAINT fk_booking_menu_selections_booking_meal_participant FOREIGN KEY (bookingMealParticipantId) REFERENCES booking_meal_participants(id) ON DELETE CASCADE;', callback);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('ALTER TABLE booking_menu_selections DROP FOREIGN KEY fk_booking_menu_selections_booking_meal_participant;', function(err) {
    if (err) return callback(err);
    db.runSql('ALTER TABLE booking_meal_participants DROP FOREIGN KEY fk_booking_meal_participants_meal_participant;', function(err) {
      if (err) return callback(err);
      db.runSql('ALTER TABLE booking_menu_selections CHANGE COLUMN bookingMealParticipantId bookingStudentId INT NOT NULL;', function(err) {
        if (err) return callback(err);
        db.runSql('ALTER TABLE booking_menu_selections RENAME INDEX idx_booking_meal_participant_id TO idx_booking_student_id;', function(err) {
          if (err) return callback(err);
          db.runSql('ALTER TABLE booking_meal_participants RENAME INDEX idx_meal_participant_id TO idx_student_id;', function(err) {
            if (err) return callback(err);
            db.runSql('ALTER TABLE booking_meal_participants CHANGE COLUMN mealParticipantId studentId INT NULL, DROP COLUMN type;', function(err) {
              if (err) return callback(err);
              db.runSql('ALTER TABLE meal_participants DROP COLUMN type;', function(err) {
                if (err) return callback(err);
                db.runSql('RENAME TABLE booking_meal_participants TO booking_students;', function(err) {
                  if (err) return callback(err);
                  db.runSql('RENAME TABLE meal_participants TO students;', function(err) {
                    if (err) return callback(err);
                    db.runSql('ALTER TABLE booking_students ADD CONSTRAINT booking_students_ibfk_2 FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE SET NULL;', function(err) {
                      if (err) return callback(err);
                      db.runSql('ALTER TABLE booking_menu_selections ADD CONSTRAINT booking_menu_selections_ibfk_2 FOREIGN KEY (bookingStudentId) REFERENCES booking_students(id) ON DELETE CASCADE;', callback);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

exports._meta = {
  "version": 1
};
