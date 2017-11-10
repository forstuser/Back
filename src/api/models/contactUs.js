/*jshint esversion: 6 */
'use strict';

export default (sequelize, DataTypes) => sequelize.define('contactUs', {
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.STRING,
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resolved_by: {
    type: DataTypes.INTEGER,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('NOW()'),
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('NOW()'),
  },
}, {
  freezeTableName: true,
  timestamps: true,
  underscored: true,
  defaultPrimaryKey: true,
  tableName: 'table_contact_us',
})