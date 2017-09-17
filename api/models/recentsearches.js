/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('recentSearches', {
	id: {
		type: Sequelize.INTEGER(11),
		allowNull: false,
		primaryKey: true,
		autoIncrement: true,
		field: 'search_id'
	},
	searchValue: {
		type: Sequelize.STRING,
		field: 'search_value'
	},
	user_id: {
		type: Sequelize.INTEGER
	},
	searchFound: {
		type: Sequelize.STRING,
		field: 'search_found'
	},
	resultCount: {
		type: Sequelize.INTEGER(11),
		field: 'result_count'
	},
	searchDate: {
		type: Sequelize.DATE,
		defaultValue: sequelize.literal('NOW()'),
		field: 'search_date'
	},
	createdAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('NOW()')
    },
    updatedAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('NOW()')
    }
}, {
	freezeTableName: true,
	defaultPrimaryKey: false,
	tableName: 'table_recent_searches'
});
