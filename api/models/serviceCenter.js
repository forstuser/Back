/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('authorizedServiceCenter', {
	center_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	brand_id: {
		type: Sequelize.INTEGER
	},
	center_name: {
		type: Sequelize.STRING
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
	address: {
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
	timings: {
		type: Sequelize.STRING
	},
	open_days: {
		type: Sequelize.STRING
	},
	updated_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
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
	tableName: 'table_authorized_service_center'
});
