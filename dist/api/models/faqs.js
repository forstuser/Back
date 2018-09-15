/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => sequelize.define('faqs', {
  question: {
    type: DataTypes.TEXT
  },
  answer: {
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status_id: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  created_at: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('NOW()')
  },
  updated_at: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('NOW()')
  }
}, {
  freezeTableName: true,
  timestamps: true,
  underscored: true,
  tableName: 'table_faqs'
});