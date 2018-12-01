'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const brand_offers = sequelize.define('brand_offers', {
    title: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    updated_by: { type: DataTypes.INTEGER },
    sku_id: { type: DataTypes.INTEGER },
    brand_id: { type: DataTypes.INTEGER },
    sku_measurement_id: { type: DataTypes.INTEGER },
    sku_measurement_type: { type: DataTypes.INTEGER },
    has_image: { type: DataTypes.BOOLEAN, defaultValue: false },
    offer_type: { type: DataTypes.INTEGER },
    excluded_seller_ids: { type: DataTypes.JSONB },
    offer_value: { type: DataTypes.FLOAT, defaultValue: 0 },
    brand_mrp: { type: DataTypes.FLOAT, defaultValue: 0 },
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
    timestamps: true, underscored: true,
    tableName: 'table_brand_offers'
  });

  brand_offers.associate = models => {
    brand_offers.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    brand_offers.belongsTo(models.brands, { foreignKey: 'brand_id', onDelete: 'cascade', onUpdate: 'cascade' });
    brand_offers.belongsTo(models.sku, { foreignKey: 'sku_id', onDelete: 'cascade', onUpdate: 'cascade' });
    brand_offers.belongsTo(models.sku_measurement, {
      foreignKey: 'sku_measurement_id',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    brand_offers.belongsTo(models.measurement, {
      foreignKey: 'sku_measurement_type',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
    brand_offers.belongsTo(models.statuses, {
      foreignKey: 'status_type', targetKey: 'status_type',
      onDelete: 'cascade', onUpdate: 'cascade'
    });
  };
  return brand_offers;
};