'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const sku_seller = sequelize.define('sku_seller', {
    sku_id: {
      type: DataTypes.INTEGER
    },
    sku_measurement_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    offer_id: {
      type: DataTypes.INTEGER
    },
    price_detail: {
      type: DataTypes.JSONB
    },
    selling_price: {
      type: DataTypes.FLOAT
    },
    offer_discount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    updated_by: {
      type: DataTypes.INTEGER
    }, is_new: { type: DataTypes.BOOLEAN, defaultValue: false },
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
    tableName: 'table_sku_seller_mapping'
  });

  sku_seller.associate = models => {
    sku_seller.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    sku_seller.belongsTo(models.sku, { foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade' });
    sku_seller.belongsTo(models.seller_offers, { foreignKey: 'offer_id', onDelete: null });
    sku_seller.belongsTo(models.sku_measurement, {
      foreignKey: 'sku_measurement_id',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sku_seller.belongsTo(models.sellers, {
      foreignKey: 'seller_id',
      as: 'seller',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
    sku_seller.belongsTo(models.statuses, {
      foreignKey: 'status_type',
      targetKey: 'status_type',
      onDelete: 'cascade',
      onUpdate: 'cascade'
    });
  };
  return sku_seller;
};