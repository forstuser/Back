/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('inclusions', {
	inclusions_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	category_id: {
		type: Sequelize.INTEGER
	},
	inclusions_name: {
		type: Sequelize.STRING
	},
	created_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	updated_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	updated_by_user_id: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_list_of_inclusions'
});
