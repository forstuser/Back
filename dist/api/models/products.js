'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var products = sequelize.define('products', {
    bill_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    job_id: {
      type: DataTypes.INTEGER
    },
    main_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    brand_id: {
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
      type: DataTypes.FLOAT
    },
    taxes: {
      type: DataTypes.FLOAT
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
      type: DataTypes.ARRAY(DataTypes.JSON)
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    paranoid: true,
    underscored: true,
    tableName: 'consumer_products'
  });

  products.associate = function (models) {
    products.belongsTo(models.bills);
    products.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    products.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });

    products.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    products.belongsTo(models.jobs, { as: 'jobs' });
    products.belongsTo(models.offlineSellers, { foreignKey: 'seller_id', as: 'sellers' });
    products.belongsTo(models.brands, { foreignKey: 'brand_id', as: 'brand' });
    products.belongsTo(models.categories, { foreignKey: 'main_category_id', as: 'mainCategory' });
    products.belongsTo(models.categories, { foreignKey: 'category_id', as: 'category' });
    products.belongsTo(models.colours, { foreignKey: 'colour_id', as: 'color' });
  };

  return products;
};