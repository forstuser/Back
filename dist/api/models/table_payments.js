'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const payments = sequelize.define('payments', {
    signature: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    ref_id: {
      type: DataTypes.STRING
    },
    order_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    amount: {
      type: DataTypes.FLOAT
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    payment_mode_id: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    payment_detail: {
      type: DataTypes.JSONB
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 4
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
    tableName: 'table_payments'
  });

  payments.associate = models => {
    payments.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    payments.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    payments.belongsTo(models.order, { foreignKey: 'order_id', onDelete: 'cascade', onUpdate: 'cascade' });
    payments.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    payments.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    payments.belongsTo(models.table_payment_mode, {
      foreignKey: 'payment_mode_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return payments;
};