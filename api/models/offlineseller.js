/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('offlineSeller', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'offline_seller_id'
	},
	offline_seller_name: {
		type: Sequelize.STRING,
		notEmpty: false
	},
	offline_seller_owner_name: {
		type: Sequelize.STRING
	},
	seller_url: {
		type: Sequelize.INTEGER
	},
	offline_seller_gstin_no: {
		type: Sequelize.STRING
	},
	offline_seller_pan_number: {
		type: Sequelize.STRING
	},
	offline_seller_registration_no: {
		type: Sequelize.STRING
	},
	is_service_provider: {
		type: Sequelize.BOOLEAN
	},
	is_onboarded: {
		type: Sequelize.BOOLEAN
	},
	address_house_no: {
		type: Sequelize.STRING
	},
	address_block: {
		type: Sequelize.STRING
	},
	address_street: {
		type: Sequelize.STRING
	},
	address_sector: {
		type: Sequelize.STRING
	},
	address_city: {
		type: Sequelize.STRING
	},
	address_state: {
		type: Sequelize.STRING
	},
	address_pin_code: {
		type: Sequelize.STRING
	},
	address_nearby: {
		type: Sequelize.STRING
	},
	latitude: {
		type: Sequelize.STRING
	},
	longitude: {
		type: Sequelize.STRING
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
	tableName: 'table_offline_seller'
});
