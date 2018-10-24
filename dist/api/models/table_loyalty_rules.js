'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const loyalty_rules = sequelize.define('loyalty_rules', {
    seller_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    rule_type: {
      type: DataTypes.INTEGER,
      comments: '1: Cash, 2: Item',
      defaultValue: 1
    },
    minimum_points: {
      type: DataTypes.FLOAT,
      defaultValue: 10
    },
    points_per_item: {
      type: DataTypes.FLOAT,
      defaultValue: 10
    },
    order_value: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    allow_auto_loyalty: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0
    },
    item_value: {
      type: DataTypes.STRING,
      defaultValue: 1
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
    tableName: 'table_loyalty_rules'
  });

  loyalty_rules.associate = models => {
    loyalty_rules.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    loyalty_rules.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    loyalty_rules.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return loyalty_rules;
};