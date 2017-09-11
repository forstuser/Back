/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('onlineSellerDetails', {
	seller_detail_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	seller_id: {
		type: Sequelize.INTEGER,
		notEmpty: true
	},
	contactdetail_type_id: {
		type: Sequelize.INTEGER
	},
	display_name: {
		type: Sequelize.STRING,
		notEmpty: false
	},
	details: {
		type: Sequelize.STRING
	},
	status_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_online_seller_details'
});
