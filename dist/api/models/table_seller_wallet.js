'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const seller_wallet = sequelize.define('seller_wallet', {
    title: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    job_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    order_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    transaction_type: {
      type: DataTypes.INTEGER,
      comment: 'Credit: 1, Debit: 2',
      defaultValue: 1
    },
    cashback_source: {
      type: DataTypes.INTEGER,
      comment: 'Home Delivery: 1, User Redeemed: 2',
      defaultValue: 1
    },
    amount: {
      type: DataTypes.FLOAT
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    is_paytm: {
      type: DataTypes.BOOLEAN, defaultValue: false
    }, paytm_detail: {
      type: DataTypes.JSONB
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 13
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
    tableName: 'table_seller_wallet'
  });

  seller_wallet.associate = models => {
    seller_wallet.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_wallet.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_wallet.belongsTo(models.cashback_jobs, { foreignKey: 'job_id', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_wallet.belongsTo(models.order, { foreignKey: 'order_id', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_wallet.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_wallet.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return seller_wallet;
};