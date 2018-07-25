'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const seller_categories = sequelize.define('seller_categories', {
    category_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    sub_category_id: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
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
    tableName: 'table_seller_category_mapping'
  });

  seller_categories.associate = models => {
    seller_categories.belongsTo(models.users, { foreignKey: 'updated_by', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_categories.belongsTo(models.sku_categories, { foreignKey: 'category_id', as: 'category', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_categories.belongsTo(models.sku_categories, { foreignKey: 'main_category_id', as: 'main_category', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_categories.belongsTo(models.sku_categories, { foreignKey: 'sub_category_id', as: 'sub_category', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_categories.belongsTo(models.offlineSellers, { foreignKey: 'seller_id', as: 'seller', onDelete: 'cascade', onUpdate: 'cascade' });
    seller_categories.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type', onDelete: 'cascade', onUpdate: 'cascade' });
  };
  return seller_categories;
};