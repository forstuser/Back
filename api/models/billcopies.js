/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('billCopies', {
	bill_copy_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	bill_id: {
		type: Sequelize.INTEGER
	},
	bill_copy_name: {
		type: Sequelize.STRING
	},
	bill_copy_type: {
		type: Sequelize.STRING
	},
	updated_by_user_id: {
		type: Sequelize.INTEGER
	},
	uploaded_by_id: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_consumer_bill_copies'
});
