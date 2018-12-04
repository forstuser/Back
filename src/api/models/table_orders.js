'use strict';

export default (sequelize, DataTypes) => {
  const order = sequelize.define('order', {
        user_id: {
          type: DataTypes.INTEGER,
        },
        delivery_user_id: {
          type: DataTypes.INTEGER,
        },
        seller_id: {
          type: DataTypes.INTEGER,
        },
        job_id: {
          type: DataTypes.INTEGER,
        },
        expense_id: {
          type: DataTypes.INTEGER,
        }, collect_at_store: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        user_address_id: {
          type: DataTypes.INTEGER,
        },
        is_modified: {
          type: DataTypes.BOOLEAN,
        },
        in_review: {
          type: DataTypes.BOOLEAN,
        },
        order_type: {
          type: DataTypes.INTEGER,
        },
        order_details: {
          type: DataTypes.JSONB,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 13,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_orders',
      });

  order.associate = (models) => {
    order.belongsTo(models.sellers,
        {
          foreignKey: 'seller_id',
          as: 'seller',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    order.belongsTo(models.users,
        {
          foreignKey: 'user_id',
          as: 'user',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    order.belongsTo(models.assisted_service_users,
        {
          foreignKey: 'delivery_user_id',
          as: 'delivery_user',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    order.belongsTo(models.user_addresses,
        {
          foreignKey: 'user_address_id',
          as: 'user_address',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    order.belongsTo(models.statuses,
        {
          foreignKey: 'status_type',
          targetKey: 'status_type',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    order.belongsTo(models.cashback_jobs,
        {
          foreignKey: 'job_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
    order.belongsTo(models.products,
        {
          foreignKey: 'expense_id',
          onDelete: 'cascade',
          onUpdate: 'cascade',
        });
  };
  return order;
};
