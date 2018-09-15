/*jshint esversion: 6 */
'use strict';

export default (sequelize, DataTypes) => {
  return sequelize.define('appVersion', {
    recommended_version: {
      type: DataTypes.INTEGER,
    },
    force_version: {
      type: DataTypes.INTEGER,
    },
    os: {
      type: DataTypes.STRING,
    }, details: {
      type: DataTypes.JSONB,
    },
    createdAt: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    tableName: 'app_version',
  });
};
