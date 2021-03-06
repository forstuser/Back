'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = (sequelize, DataTypes) => {
  const products = sequelize.define('products', {
    bill_id: {
      type: DataTypes.INTEGER
    },
    job_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER
    },
    sub_category_id: {
      type: DataTypes.INTEGER
    },
    category_id: {
      type: DataTypes.INTEGER
    },
    brand_id: {
      type: DataTypes.INTEGER
    },
    service_schedule_id: {
      type: DataTypes.INTEGER
    },
    colour_id: {
      type: DataTypes.INTEGER
    },
    document_number: {
      type: DataTypes.STRING
    },
    product_name: {
      type: DataTypes.STRING
    },
    purchase_cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    file_type: {
      type: DataTypes.STRING
    },
    file_ref: {
      type: DataTypes.STRING
    },
    taxes: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    document_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    accessory_id: {
      type: DataTypes.INTEGER
    },
    accessory_part_id: {
      type: DataTypes.INTEGER
    },
    ref_id: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    copies: {
      type: DataTypes.ARRAY(DataTypes.JSONB)
    },
    model: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    underscored: true,
    tableName: 'consumer_products'
  });

  products.associate = models => {
    products.belongsTo(models.bills);
    products.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    products.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });
    products.hasMany(models.amcs, { foreignKey: 'product_id', onDelete: 'cascade' });
    products.hasMany(models.insurances, { foreignKey: 'product_id', onDelete: 'cascade' });
    products.hasMany(models.warranties, { foreignKey: 'product_id', onDelete: 'cascade' });
    products.hasMany(models.pucs, { foreignKey: 'product_id', onDelete: 'cascade' });
    products.hasMany(models.repairs, { foreignKey: 'product_id', onDelete: 'cascade' });

    products.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    products.belongsTo(models.jobs, { as: 'jobs', foreignKey: 'job_id' });
    products.belongsTo(models.sellers, { foreignKey: 'seller_id', as: 'sellers' });
    products.belongsTo(models.table_accessory_categories, { foreignKey: 'accessory_id', as: 'accessory', onDelete: 'cascade' });
    products.belongsTo(models.accessory_part, {
      foreignKey: 'accessory_part_id',
      as: 'accessory_part',
      onDelete: 'cascade'
    });
    products.belongsTo(models.brands, { foreignKey: 'brand_id', as: 'brand' });
    products.belongsTo(models.categories, { foreignKey: 'main_category_id', as: 'mainCategory' });
    products.belongsTo(models.categories, { foreignKey: 'category_id', as: 'category' });
    products.belongsTo(models.categories, { foreignKey: 'sub_category_id', as: 'sub_category' });
    products.belongsTo(models.colours, { foreignKey: 'colour_id', as: 'color' });
    products.belongsTo(models.serviceSchedules, { foreignKey: 'service_schedule_id', as: 'schedule' });
    products.hasMany(models.metaData, { foreignKey: 'product_id', as: 'metaData', onDelete: 'cascade' });

    products.hasMany(models.productReviews, {
      foreignKey: 'bill_product_id',
      as: 'productReviews',
      onDelete: 'cascade'
    });
  };

  return products;
};