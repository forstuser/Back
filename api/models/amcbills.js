/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('amcBills', {
	bill_amc_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	billProductID: {
		type: Sequelize.INTEGER,
		field: 'bill_product_id'
	},
	sellerType: {
		type: Sequelize.INTEGER,
		field: 'seller_type'
	},
	sellerID: {
		type: Sequelize.INTEGER,
		field: 'seller_id'
	},
	policyNo: {
		type: Sequelize.STRING,
		field: 'policy_number'
	},
	premiumType: {
		type: Sequelize.ENUM('Yearly', 'HalfYearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'),
		allowNull: false,
		defaultValue: 'Yearly',
		field: 'premium_type'
	},
	premiumAmount: {
		type: Sequelize.FLOAT,
		field: 'premium_amount'
	},
	effectiveDate: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NULL'),
		field: 'policy_effective_date'
	},
	expiryDate: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NULL'),
		field: 'policy_expiry_date'
	},
	user_id: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	},
	createdAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()'),
		field: 'createdAt'
	},
	updatedAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()'),
		field: 'updatedAt'
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_amc'
});
