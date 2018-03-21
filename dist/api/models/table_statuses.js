/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var statuses = sequelize.define('statuses', {
    status_id: {
      type: DataTypes.INTEGER,
      unique: true,
      primaryKey: true,
      autoIncrement: true
    },
    status_type: {
      type: DataTypes.INTEGER,
      unique: true
    },
    status_name: {
      type: DataTypes.STRING,
      unique: true
    },
    status_description: {
      type: DataTypes.STRING,
      unique: true
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
    defaultPrimaryKey: false,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'statuses'
  });

  statuses.associate = function (models) {
    statuses.hasMany(models.users, { foreignKey: 'user_status_type', sourceKey: 'status_type' });
    statuses.hasMany(models.jobs, { foreignKey: 'user_status', sourceKey: 'status_type' });
    statuses.hasMany(models.jobs, { foreignKey: 'admin_status', sourceKey: 'status_type' });

    statuses.hasMany(models.jobs, { foreignKey: 'ce_status', sourceKey: 'status_type' });
    statuses.hasMany(models.jobs, { foreignKey: 'qe_status', sourceKey: 'status_type' });
  };

  return statuses;
};