/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('onlineSeller', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'seller_id'
	},
	seller_name: {
		type: Sequelize.STRING,
		notEmpty: false
	},
	seller_url: {
		type: Sequelize.STRING
	},
	GstinNo: {
		type: Sequelize.STRING,
		field: 'seller_gstin_no'
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
	tableName: 'table_online_seller'
});
