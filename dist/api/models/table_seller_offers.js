'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const seller_offers = sequelize.define('seller_offers', {
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    document_details: { type: DataTypes.JSONB },
    seller_id: { type: DataTypes.INTEGER },
    offer_type: { type: DataTypes.INTEGER, defaultValue: 1 },
    on_sku: { type: DataTypes.BOOLEAN, defaultValue: false },
    updated_by: { type: DataTypes.INTEGER },
    sku_id: { type: DataTypes.INTEGER },
    sku_measurement_id: { type: DataTypes.INTEGER },
    sku_measurement_type: { type: DataTypes.INTEGER },
    brand_offer_id: { type: DataTypes.INTEGER },
    offer_discount: { type: DataTypes.FLOAT, defaultValue: 0 },
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
    tableName: 'table_seller_offers'
  });

  seller_offers.associate = models => {
    seller_offers.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_offers.belongsTo(models.sellers, {
      foreignKey: 'seller_id', as: 'seller',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offers.belongsTo(models.statuses, {
      foreignKey: 'status_type', targetKey: 'status_type',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offers.belongsTo(models.brand_offers, {
      foreignKey: 'brand_offer_id',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offers.belongsTo(models.sku, { foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_offers.belongsTo(models.sku_measurement, {
      foreignKey: 'sku_measurement_id',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    seller_offers.belongsTo(models.measurement, {
      foreignKey: 'sku_measurement_type',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
  };
  return seller_offers;
};