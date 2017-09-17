/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('table_qual_executive_tasks', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'id'
	},
	Comments: {
		type: Sequelize.STRING,
		field: 'comments'
	},
	BillID: {
		type: Sequelize.INTEGER,
		field: 'bill_id'
	},
	TaskAssignedDate: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()'),
		field: 'created_on'
	},
	updated_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	user_id: {
		type: Sequelize.INTEGER
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
	timestamps: false
});
