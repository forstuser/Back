/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('fcmDetails', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		unique: true
	},
	user_id: {
		type: Sequelize.INTEGER
	},
	fcm_id: {
		type: Sequelize.STRING,
		unique: true
	},
	createdAt: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	updatedAt: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	}
}, {
	freezeTableName: true,
	tableName: 'table_fcm_details'
});