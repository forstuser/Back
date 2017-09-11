/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('warrantyInclusion', {
	warranty_inclusions_id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	bill_warranty_id: {
		type: Sequelize.INTEGER(11)
	},
	inclusions_id: {
		type: Sequelize.INTEGER(11)
	}
}, {
	tableName: 'table_consumer_bill_warranty_inclusions',
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false
});
