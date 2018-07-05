'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const quantities = sequelize.define('quantities', {
    quantity_name: {
      type: DataTypes.STRING
    },
    quantity_name_hi: {
      type: DataTypes.STRING
    },
    quantity_name_en: {
      type: DataTypes.STRING
    },
    quantity_name_ta: {
      type: DataTypes.STRING
    },
    quantity_name_bn: {
      type: DataTypes.STRING
    },
    quantity_name_ml: {
      type: DataTypes.STRING
    },
    quantity_name_te: {
      type: DataTypes.STRING
    },
    quantity_name_gu: {
      type: DataTypes.STRING
    },
    quantity_name_kn: {
      type: DataTypes.STRING
    },
    quantity_name_mr: {
      type: DataTypes.STRING
    },
    quantity_type: {
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
    underscored: true,
    tableName: 'table_quantity'
  });

  quantities.associate = models => {
    quantities.belongsTo(models.users, { foreignKey: 'updated_by' });
    quantities.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
  };
  return quantities;
};