/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('warrantyCopies', {
	ID: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	bill_warranty_id: {
		type: Sequelize.INTEGER(11),
		allowNull: false
	},
	bill_copy_id: {
		type: Sequelize.INTEGER(11),
		allowNull: false
	}
}, {
	tableName: 'table_consumer_bill_warranty_copies',
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false
});
