/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('insuranceExclusion', {
	insurance_exclusions_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	bill_insurance_id: {
		type: Sequelize.INTEGER
	},
	exclusions_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_insurance_exclusions'
});
