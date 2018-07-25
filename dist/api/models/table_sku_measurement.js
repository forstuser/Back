'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const measurement = sequelize.define('measurement', {
    title: {
      type: DataTypes.STRING
    },
    acronym: {
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
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_sku_measurement'
  });

  measurement.associate = models => {
    measurement.belongsTo(models.users, { foreignKey: 'updated_by' });
    measurement.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return measurement;
};