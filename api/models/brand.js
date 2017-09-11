/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('table_brands', {
	brand_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	brand_name: {
		type: Sequelize.STRING,
		notEmpty: false
	},
	brand_description: {
		type: Sequelize.STRING
	},
	created_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	updated_on: {
		type: Sequelize.DATE(6),
		defaultValue: Sequelize.NOW
	},
	updated_by_user_id: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false
});
