/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('appVersion', {
	recommended_version: {
		type: Sequelize.INTEGER
	},
	force_version: {
		type: Sequelize.INTEGER
	},
	createdAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updatedAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
}, {
	freezeTableName: true,
	defaultPrimaryKey: true,
	timestamps: true,
	tableName: 'table_app_version'
});
