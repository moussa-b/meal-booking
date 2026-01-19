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
  // Drop the old unique constraint/index (ignore error if it doesn't exist)
  // In MySQL, unique constraints are implemented as indexes
  db.runSql('ALTER TABLE weekly_menus DROP INDEX unique_week_start;', function(err) {
    // Ignore error if index doesn't exist (might not exist in some cases)
    if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
      return callback(err);
    }
    
    // Get the first school ID to use as default for existing records
    db.runSql('SELECT id FROM schools LIMIT 1;', function(err, result) {
      if (err) return callback(err);
      
      const defaultSchoolId = result && result.length > 0 ? result[0].id : null;
      
      if (defaultSchoolId) {
        // Add schoolId column with default value for existing records
        db.runSql('ALTER TABLE weekly_menus ADD COLUMN schoolId INT NULL;', function(err) {
          if (err) return callback(err);
          
          // Update existing records with default school
          db.runSql('UPDATE weekly_menus SET schoolId = ? WHERE schoolId IS NULL;', [defaultSchoolId], function(err) {
            if (err) return callback(err);
            
            // Make schoolId NOT NULL
            db.runSql('ALTER TABLE weekly_menus MODIFY COLUMN schoolId INT NOT NULL;', function(err) {
              if (err) return callback(err);
              
              // Add foreign key
              db.runSql('ALTER TABLE weekly_menus ADD CONSTRAINT fk_weekly_menus_school FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;', function(err) {
                if (err) return callback(err);
                
                // Add unique constraint
                db.runSql('ALTER TABLE weekly_menus ADD CONSTRAINT unique_school_week_start UNIQUE (schoolId, weekStartDate);', function(err) {
                  if (err) return callback(err);
                  
                  // Add index on schoolId
                  db.runSql('CREATE INDEX idx_school_id ON weekly_menus (schoolId);', callback);
                });
              });
            });
          });
        });
      } else {
        // No schools exist, we need to create the column as nullable first
        // This is a problem - we can't have NOT NULL without a default
        // For now, we'll make it nullable and the application should handle it
        db.runSql('ALTER TABLE weekly_menus ADD COLUMN schoolId INT NULL;', function(err) {
          if (err) return callback(err);
          
          // Add foreign key (nullable)
          db.runSql('ALTER TABLE weekly_menus ADD CONSTRAINT fk_weekly_menus_school FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;', function(err) {
            if (err) return callback(err);
            
            // Add unique constraint (allows NULL values)
            db.runSql('ALTER TABLE weekly_menus ADD CONSTRAINT unique_school_week_start UNIQUE (schoolId, weekStartDate);', function(err) {
              if (err) return callback(err);
              
              // Add index on schoolId
              db.runSql('CREATE INDEX idx_school_id ON weekly_menus (schoolId);', callback);
            });
          });
        });
      }
    });
  });
};

exports.down = function(db, callback) {
  // Drop index on schoolId (ignore error if it doesn't exist)
  db.runSql('ALTER TABLE weekly_menus DROP INDEX idx_school_id;', function(err) {
    if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
      return callback(err);
    }
    
    // Drop unique constraint (it's an index in MySQL)
    db.runSql('ALTER TABLE weekly_menus DROP INDEX unique_school_week_start;', function(err) {
      if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
        return callback(err);
      }
      
      // Drop foreign key constraint
      db.runSql('ALTER TABLE weekly_menus DROP FOREIGN KEY fk_weekly_menus_school;', function(err) {
        if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown key")) {
          return callback(err);
        }
        
        // Drop column
        db.runSql('ALTER TABLE weekly_menus DROP COLUMN schoolId;', function(err) {
          if (err && !err.message.includes("doesn't exist") && !err.message.includes("Unknown column")) {
            return callback(err);
          }
          
          // Restore the old unique constraint
          db.runSql('ALTER TABLE weekly_menus ADD CONSTRAINT unique_week_start UNIQUE (weekStartDate);', callback);
        });
      });
    });
  });
};

exports._meta = {
  "version": 1
};
