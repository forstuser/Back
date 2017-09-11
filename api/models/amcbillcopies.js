/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('amcBillCopies', {
	ID: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		field: 'id'
	},
	BillAMCID: {
		type: Sequelize.INTEGER,
		field: 'bill_amc_id'
	},
	bill_copy_id: {
		type: Sequelize.INTEGER(11),
		allowNull: false
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_amc_copies'
});
