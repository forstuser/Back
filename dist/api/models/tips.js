/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  return sequelize.define('tips', {
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
};