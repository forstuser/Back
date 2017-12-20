'use strict';

import config from '../../config/main';
import Sequelize from 'sequelize';
import path from 'path';
import fs from 'fs';

const database = config.DATABASE;
const Op = Sequelize.Op;
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
    $col: Op.col
};
const sequelize = new Sequelize(
	database.database,
	database.username,
	database.password,
	database
);
/* const tediousSequelize = new Sequelize(
  config.msSQLDatabase.database,
  config.msSQLDatabase.username,
  config.msSQLDatabase.password,
  config.msSQLDatabase
); */
const db = {};

fs.readdirSync(__dirname).filter(file => (file.indexOf('.') !== 0) && (file !== 'index.js')).forEach((file) => {
	const model = sequelize.import(path.join(__dirname, file));
	// model.removeAttribute('id');
	db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
	if ('associate' in db[modelName]) {
		db[modelName].associate(db);
	}
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
