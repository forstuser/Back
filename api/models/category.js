/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('categories', {
	category_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	display_id: {
		type: Sequelize.INTEGER
	},
	category_name: {
		type: Sequelize.STRING,
		notEmpty: false
	},
	ref_id: {
		type: Sequelize.INTEGER
	},
	category_level: {
		type: Sequelize.INTEGER
	},
	created_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updated_on: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()')
	},
	updated_by_user_id: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	},
	category_image_name: {
		type: Sequelize.STRING(255)
	},
	category_image_type: {
		type: Sequelize.STRING(45)
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_categories'
});
