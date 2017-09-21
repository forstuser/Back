/*jshint esversion: 6 */
'use strict';

module.exports = (sequelize, Sequelize) => sequelize.define('faqs', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	question: {
		type: Sequelize.TEXT
	},
    answer: {
        type: Sequelize.TEXT
    },
	status_id:{
		type: Sequelize.INTEGER,
		defaultValue: 1
	},
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('NOW()'),
        field: 'createdAt'
    },
    updatedAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('NOW()'),
        field: 'updatedAt'
    }
}, {
	freezeTableName: true,
	tableName: 'table_faqs'
});
