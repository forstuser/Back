'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var renewalTypes = sequelize.define('renewalTypes', {
    title: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING
    },
    effective_hours: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'renewal_types'
  });

  renewalTypes.associate = function (models) {
    renewalTypes.belongsTo(models.users, { foreignKey: 'updated_by' });

    renewalTypes.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return renewalTypes;
};