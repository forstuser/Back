'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const limit_rules = sequelize.define('limit_rules', {
    seller_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    rule_type: {
      type: DataTypes.INTEGER,
      comment: 'User Monthly Limit: 1, User Daily Limit: 2, User Per Bill Limit: 3, Seller Monthly Limit: 4, Seller Daily Limit: 5 and Seller Per Bill Limit: 6'
    },
    rule_limit: {
      type: DataTypes.FLOAT
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
    },
    paid_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_limits_rules'
  });

  limit_rules.associate = models => {
    limit_rules.belongsTo(models.users, {
      foreignKey: 'updated_by',
      as: 'updater',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    limit_rules.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    limit_rules.hasMany(models.cashback_jobs, {
      foreignKey: 'limit_rule_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    limit_rules.belongsTo(models.users, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    limit_rules.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return limit_rules;
};