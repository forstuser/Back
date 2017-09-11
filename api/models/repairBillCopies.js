/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('repairBillCopies', {
	id: {
		type: DataTypes.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	bill_repair_id: {
		type: DataTypes.INTEGER(11),
		allowNull: false
	},
	bill_copy_id: {
		type: DataTypes.INTEGER(11),
		allowNull: false
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_repair_copies'
});
