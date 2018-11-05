'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const detailTypes = sequelize.define('detailTypes', {
    title: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.STRING
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
    created_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'detail_types'
  });

  detailTypes.associate = models => {
    detailTypes.belongsTo(models.users, { foreignKey: 'updated_by' });

    detailTypes.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return detailTypes;
};