'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const seller_offer_request = sequelize.define('seller_offer_request', {
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    seller_id: { type: DataTypes.INTEGER },
    offer_type: { type: DataTypes.INTEGER, defaultValue: 1 },
    updated_by: { type: DataTypes.INTEGER },
    sku_id: { type: DataTypes.INTEGER },
    sku_measurement_id: { type: DataTypes.INTEGER },
    sku_measurement_type: { type: DataTypes.INTEGER },
    brand_offer_id: { type: DataTypes.INTEGER },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    offer_value: { type: DataTypes.FLOAT, defaultValue: 0 },
    seller_mrp: { type: DataTypes.FLOAT, defaultValue: 0 },
    status_type: { type: DataTypes.INTEGER, defaultValue: 1 },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    start_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    end_date: { type: DataTypes.DATEONLY }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'table_seller_offer_request'
  });

  seller_offer_request.associate = models => {
    seller_offer_request.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_offer_request.belongsTo(models.sellers, {
      foreignKey: 'seller_id', as: 'seller',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offer_request.belongsTo(models.statuses, {
      foreignKey: 'status_type', targetKey: 'status_type',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offer_request.belongsTo(models.brand_offers, {
      foreignKey: 'brand_offer_id',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offer_request.belongsTo(models.sku, { foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_offer_request.belongsTo(models.sku_measurement, {
      foreignKey: 'sku_measurement_id',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offer_request.belongsTo(models.measurement, {
      foreignKey: 'sku_measurement_type',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
  };
  return seller_offer_request;
};