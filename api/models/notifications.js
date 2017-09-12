/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('mailBox', {
	notification_id: {
		type: DataTypes.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	user_id: {
		type: DataTypes.INTEGER(11),
		allowNull: false
	},
	bill_product_id: {
		type: DataTypes.INTEGER(11)
	},
	total_amount: {
		type: DataTypes.FLOAT
	},
	taxes: {
		type: DataTypes.FLOAT
	},
	due_amount: {
		type: DataTypes.FLOAT
	},
	due_date: {
		type: DataTypes.DATE
	},
	notification_type: {
		type: DataTypes.INTEGER(11)
	},
	title: {
		type: DataTypes.STRING
	},
	description: {
		type: DataTypes.STRING(2000)
	},
	status_id: {
		type: DataTypes.INTEGER(11),
		defaultValue: 4
	},
	createdAt: {
		type: DataTypes.DATE(6),
		default: DataTypes.NOW,
		field: 'createdAt'
	},
	updatedAt: {
		type: DataTypes.DATE(6),
		default: DataTypes.NOW,
		field: 'updatedAt'
	},
	bill_id: {
		type: DataTypes.INTEGER
	}
}, {
	freezeTableName: true,
	tableName: 'table_inbox_notification'
});
