/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('categoryForm', {
	category_form_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	category_id: {
		type: Sequelize.INTEGER
	},
	form_element_name: {
		type: Sequelize.STRING,
		notEmpty: false
	},
	form_element_type: {
		type: Sequelize.INTEGER
	},
	status_id: {
		type: Sequelize.INTEGER
	}
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	timestamps: false,
	tableName: 'table_category_form'
});
