'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const table_payment_mode = sequelize.define('table_payment_mode', {

    title: {
      type: DataTypes.STRING
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
    },
    updated_by: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_payment_mode'
  });

  table_payment_mode.associate = models => {

    table_payment_mode.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });

    table_payment_mode.belongsTo(models.users, {
      foreignKey: 'updated_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    table_payment_mode.belongsTo(models.users, {
      foreignKey: 'created_by',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    table_payment_mode.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return table_payment_mode;
};