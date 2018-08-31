'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const expense_sku_items = sequelize.define('expense_sku_items', {
    sku_id: {
      type: DataTypes.INTEGER
    },
    sku_measurement_id: {
      type: DataTypes.INTEGER
    },
    expense_id: {
      type: DataTypes.INTEGER
    },
    job_id: {
      type: DataTypes.INTEGER
    },
    available_cashback: {
      type: DataTypes.FLOAT
    },
    selling_price: {
      type: DataTypes.FLOAT
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    quantity: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    timely_added: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    added_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
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
    tableName: 'table_expense_sku'
  });

  expense_sku_items.associate = models => {
    expense_sku_items.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    expense_sku_items.belongsTo(models.sku, { foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade' });
    expense_sku_items.belongsTo(models.cashback_jobs, { foreignKey: 'job_id', onDelete: 'cascade', onUpdate: 'cascade' });
    expense_sku_items.belongsTo(models.sku_measurement, {
      foreignKey: 'sku_measurement_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    expense_sku_items.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    expense_sku_items.belongsTo(models.products, {
      foreignKey: 'expense_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    expense_sku_items.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    expense_sku_items.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return expense_sku_items;
};