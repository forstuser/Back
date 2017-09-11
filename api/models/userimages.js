/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('userImages', {
	user_image_id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	user_id: {
		type: Sequelize.INTEGER
	},
	user_image_name: {
		type: Sequelize.STRING
	},
	user_image_type: {
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
	tableName: 'table_user_images'
});
