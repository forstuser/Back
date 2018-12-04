/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => sequelize.define('tips', {
  tip: {
    type: DataTypes.TEXT
  },
  color: {
    type: DataTypes.TEXT
  }
}, {
  freezeTableName: true,
  timestamps: true,
  underscored: true,
  tableName: 'table_tips'
});