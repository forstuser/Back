/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('consumerBillDetails', {
	bill_detail_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	BillID: {
		type: Sequelize.INTEGER,
		field: 'bill_id'
	},
	consumer_name: {
		type: Sequelize.STRING
	},
	consumer_email_id: {
		type: Sequelize.STRING,
		validate: {
			isEmail: true
		}
	},
	consumer_phone_no: {
		type: Sequelize.STRING
	},
	document_id: {
		type: Sequelize.INTEGER
	},
	invoice_number: {
		type: Sequelize.STRING
	},
	total_purchase_value: {
		type: Sequelize.FLOAT
	},
	taxes: {
		type: Sequelize.FLOAT
	},
	purchase_date: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NULL')
	},
	created_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updated_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updated_by_user_id: {
		type: Sequelize.INTEGER
	},
	user_id: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_details'
});
