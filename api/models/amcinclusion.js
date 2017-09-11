/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('amcInclusion', {
	amc_inclusions_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	bill_amc_id: {
		type: Sequelize.INTEGER,
		field: 'bill_amc_id'
	},
	inclusions_id: {
		type: Sequelize.INTEGER,
		field: 'inclusions_id'
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_amc_inclusions'
});
