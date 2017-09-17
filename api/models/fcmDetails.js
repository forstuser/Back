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
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updatedAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	}
}, {
	freezeTableName: true,
	tableName: 'table_fcm_details'
});