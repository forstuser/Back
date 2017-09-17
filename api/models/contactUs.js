/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('contactUs', {
	name: {
		type: Sequelize.STRING
	},
	email: {
		type: Sequelize.STRING,
	},
	phone: {
		type: Sequelize.STRING
	},
	message: {
		type: Sequelize.STRING
	},
	createdAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updatedAt: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	resolved: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	resolved_by: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: true,
	timestamps: false,
	tableName: "table_contact_us"
});
