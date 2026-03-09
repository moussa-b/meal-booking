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

function runStatements(db, statements, callback) {
  const runNext = (index) => {
    if (index >= statements.length) {
      return callback();
    }

    db.runSql(statements[index], function(err) {
      if (err) return callback(err);
      runNext(index + 1);
    });
  };

  runNext(0);
}

exports.up = function(db, callback) {
  runStatements(
    db,
    [
      'ALTER TABLE bookings DROP FOREIGN KEY bookings_ibfk_1;',
      'ALTER TABLE weekly_menus DROP FOREIGN KEY fk_weekly_menus_school;',
      'ALTER TABLE bookings DROP INDEX idx_school_id;',
      'ALTER TABLE weekly_menus DROP INDEX unique_school_week_start;',
      'ALTER TABLE weekly_menus DROP INDEX idx_school_id;',
      'RENAME TABLE schools TO organizations;',
      'ALTER TABLE bookings CHANGE COLUMN schoolId organizationId INT NOT NULL;',
      'ALTER TABLE weekly_menus CHANGE COLUMN schoolId organizationId INT NOT NULL;',
      'CREATE INDEX idx_organization_id ON bookings (organizationId);',
      'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE RESTRICT;',
      'ALTER TABLE weekly_menus ADD CONSTRAINT unique_organization_week_start UNIQUE (organizationId, weekStartDate);',
      'CREATE INDEX idx_organization_id ON weekly_menus (organizationId);',
      'ALTER TABLE weekly_menus ADD CONSTRAINT fk_weekly_menus_organization FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE RESTRICT;'
    ],
    callback
  );
};

exports.down = function(db, callback) {
  runStatements(
    db,
    [
      'ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_organization;',
      'ALTER TABLE weekly_menus DROP FOREIGN KEY fk_weekly_menus_organization;',
      'ALTER TABLE bookings DROP INDEX idx_organization_id;',
      'ALTER TABLE weekly_menus DROP INDEX unique_organization_week_start;',
      'ALTER TABLE weekly_menus DROP INDEX idx_organization_id;',
      'ALTER TABLE bookings CHANGE COLUMN organizationId schoolId INT NOT NULL;',
      'ALTER TABLE weekly_menus CHANGE COLUMN organizationId schoolId INT NOT NULL;',
      'RENAME TABLE organizations TO schools;',
      'CREATE INDEX idx_school_id ON bookings (schoolId);',
      'ALTER TABLE bookings ADD CONSTRAINT bookings_ibfk_1 FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;',
      'ALTER TABLE weekly_menus ADD CONSTRAINT unique_school_week_start UNIQUE (schoolId, weekStartDate);',
      'CREATE INDEX idx_school_id ON weekly_menus (schoolId);',
      'ALTER TABLE weekly_menus ADD CONSTRAINT fk_weekly_menus_school FOREIGN KEY (schoolId) REFERENCES schools(id) ON DELETE RESTRICT;'
    ],
    callback
  );
};

exports._meta = {
  "version": 1
};
