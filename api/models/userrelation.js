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
			type: Sequelize.DATE,
			defaultValue: sequelize.literal('NOW()')
		},
		createdAt: {
			type: Sequelize.DATE,
            defaultValue: sequelize.literal('NOW()')
		},
		token_updated: {
			type: Sequelize.DATE,
            defaultValue: sequelize.literal('NOW()')
		}
	},
	{
		freezeTableName: true,
		defaultPrimaryKey: false
	});
