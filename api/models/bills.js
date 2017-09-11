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
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	updated_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
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
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bills'
});
