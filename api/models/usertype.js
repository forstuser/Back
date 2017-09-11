/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('table_user_type', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'user_type_id'
	},
	Name: {
		type: Sequelize.STRING,
		field: 'user_type_name'
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false
});
