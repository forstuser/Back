/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('warranty', {
	bill_warranty_id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	billProductID: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
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
	warrantyType: {
		type: Sequelize.STRING(100),
		allowNull: false,
		field: 'warranty_type'
	},
	user_id: {
		type: Sequelize.INTEGER
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
		type: Sequelize.DATE(6),
		default: Sequelize.NOW,
		field: 'policy_effective_date'
	},
	expiryDate: {
		type: Sequelize.DATE(6),
		default: Sequelize.NOW,
		field: 'policy_expiry_date'
	},
	status_id: {
		type: Sequelize.INTEGER(11),
		allowNull: false
	},
	createdAt: {
		type: Sequelize.DATE(6),
		default: Sequelize.NOW,
		field: 'createdAt'
	},
	updatedAt: {
		type: Sequelize.DATE(6),
		default: Sequelize.NOW,
		field: 'updatedAt'
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_warranty'
});
