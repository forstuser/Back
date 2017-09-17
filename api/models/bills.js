/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('consumerBills', {
	bill_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	bill_reference_id: {
		type: Sequelize.STRING
	},
	created_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
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
	uploaded_by: {
		type: Sequelize.INTEGER
	},
	user_status: {
		type: Sequelize.INTEGER
	},
	admin_status: {
		type: Sequelize.INTEGER
	},
	comments: {
		type: Sequelize.STRING
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bills'
});
