'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const user_index = sequelize.define('user_index', {
    user_id: {
      type: DataTypes.INTEGER
    }, document_ids: {
      type: DataTypes.JSONB
    },
    expense_ids: {
      type: DataTypes.JSONB
    },
    seller_contact_no: {
      type: DataTypes.JSONB
    },
    pop_up_counter: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    product_ids: {
      type: DataTypes.JSONB
    },
    insurance_ids: {
      type: DataTypes.JSONB
    },
    warranty_ids: {
      type: DataTypes.JSONB
    },
    repair_ids: {
      type: DataTypes.JSONB
    },
    amc_ids: {
      type: DataTypes.JSONB
    },
    puc_ids: {
      type: DataTypes.JSONB
    },
    rc_ids: {
      type: DataTypes.JSONB
    },
    accessory_ids: {
      type: DataTypes.JSONB
    },
    refueling_ids: {
      type: DataTypes.JSONB
    },
    calendar_item_ids: {
      type: DataTypes.JSONB
    },
    cashback_job_ids: {
      type: DataTypes.JSONB
    },
    wallet_seller_cashback_ids: {
      type: DataTypes.JSONB
    },
    wallet_user_cashback_ids: {
      type: DataTypes.JSONB
    },
    wallet_seller_loyalty_ids: {
      type: DataTypes.JSONB
    },
    wallet_seller_credit_ids: {
      type: DataTypes.JSONB
    },
    my_seller_ids: {
      type: DataTypes.JSONB
    },
    wishlist_items: {
      type: DataTypes.JSONB
    },
    past_selections: {
      type: DataTypes.JSONB
    },
    messages: {
      type: DataTypes.JSONB
    },
    seller_offer_ids: {
      type: DataTypes.JSONB
    },
    assisted_services: {
      type: DataTypes.JSONB
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
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
    tableName: 'table_user_index'
  });

  user_index.associate = models => {
    user_index.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    user_index.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    user_index.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return user_index;
};