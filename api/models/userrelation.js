/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('table_users_temp', {
		user_temp_id: {
			type: Sequelize.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		OTP: {
			type: Sequelize.STRING,
			field: 'tmp_password'
		},
		valid_turns: {
			type: Sequelize.INTEGER,
			defaultValue: 0
		},
		PhoneNo: {
			type: Sequelize.STRING,
			unique: true,
			field: 'mobile_no'
		},
		secret: {
			type: Sequelize.STRING(2000)
		},
		updatedAt: {
			type: Sequelize.DATE(6),
			defaultValue: Sequelize.NOW
		},
		createdAt: {
			type: Sequelize.DATE(6)
		},
		token_updated: {
			type: Sequelize.DATE(6)
		}
	},
	{
		freezeTableName: true,
		defaultPrimaryKey: false
	});
