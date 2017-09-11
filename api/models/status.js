/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('table_status', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'status_id'
	},
	Name: {
		type: Sequelize.STRING,
		field: 'status_name'
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false
});
