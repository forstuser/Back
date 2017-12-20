'use strict';

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

var database = _main2.default.DATABASE;
var Op = _sequelize2.default.Op;
database.operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col,
};
var sequelize = new _sequelize2.default(database.database, database.username,
    database.password, database);
/* const tediousSequelize = new Sequelize(
  config.msSQLDatabase.database,
  config.msSQLDatabase.username,
  config.msSQLDatabase.password,
  config.msSQLDatabase
); */
var db = {};

_fs2.default.readdirSync(__dirname).filter(function(file) {
  return file.indexOf('.') !== 0 && file !== 'index.js';
}).forEach(function(file) {
  var model = sequelize.import(_path2.default.join(__dirname, file));
  // model.removeAttribute('id');
  db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = _sequelize2.default;

module.exports = db;