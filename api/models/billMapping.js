/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, DataTypes) => sequelize.define('billMapping', {
	bill_id: {
		type: DataTypes.INTEGER(11),
		allowNull: false
	},
	bill_ref_type: {
		type: DataTypes.INTEGER(11),
		allowNull: false
	},
	ref_id: {
		type: DataTypes.INTEGER(11),
		allowNull: false
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_mapping'
});
