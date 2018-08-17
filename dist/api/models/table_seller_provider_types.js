'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const seller_provider_type = sequelize.define('seller_provider_type', {
    provider_type_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    sub_category_id: {
      type: DataTypes.INTEGER
    },
    category_4_id: {
      type: DataTypes.INTEGER
    },
    brand_ids: {
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
    tableName: 'table_seller_provider_types'
  });

  seller_provider_type.associate = models => {
    seller_provider_type.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_provider_type.belongsTo(models.provider_types, {
      foreignKey: 'provider_type_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_provider_type.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_provider_type.belongsTo(models.categories, {
      foreignKey: 'sub_category_id',
      as: 'sub_category',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_provider_type.belongsTo(models.categories, {
      foreignKey: 'category_4_id',
      as: 'category_4',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    seller_provider_type.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return seller_provider_type;
};