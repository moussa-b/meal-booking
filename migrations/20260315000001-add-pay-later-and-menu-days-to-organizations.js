'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
};

exports.up = function (db, callback) {
    db.runSql('ALTER TABLE organizations ADD COLUMN pay_later_enabled TINYINT(1) NOT NULL DEFAULT 1;', function (err) {
        if (err) return callback(err);
        db.runSql('ALTER TABLE organizations ADD COLUMN menu_day_of_week JSON NULL;', function (err) {
            if (err) return callback(err);
            db.runSql("UPDATE organizations SET menu_day_of_week = CAST('[0,1,2,3,4,5,6]' AS JSON) WHERE menu_day_of_week IS NULL;", function (err) {
                if (err) return callback(err);
                db.runSql('ALTER TABLE organizations MODIFY COLUMN menu_day_of_week JSON NOT NULL;', callback);
            });
        });
    });
};

exports.down = function (db, callback) {
    db.runSql('ALTER TABLE organizations DROP COLUMN pay_later_enabled;', function (err) {
        if (err) return callback(err);
        db.runSql('ALTER TABLE organizations DROP COLUMN menu_day_of_week;', callback);
    });
};

exports._meta = {
    "version": 1
};
