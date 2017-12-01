'use strict';

export default (sequelize, DataTypes) => {
  const products = sequelize.define('products', {
        bill_id: {
          type: DataTypes.INTEGER,
        },
        job_id: {
          type: DataTypes.INTEGER,
        },
        main_category_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        brand_id: {
          type: DataTypes.INTEGER,
        },
        colour_id: {
          type: DataTypes.INTEGER,
        },
        document_number: {
          type: DataTypes.STRING
        },
        product_name: {
          type: DataTypes.STRING,
        },
        purchase_cost: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        taxes: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
        document_date: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()')
        },
        user_id: {
          type: DataTypes.INTEGER,
        },
        updated_by: {
          type: DataTypes.INTEGER,
        },
        seller_id: {
          type: DataTypes.INTEGER,
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        copies: {
          type: DataTypes.ARRAY(DataTypes.JSONB),
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        paranoid: true,
        underscored: true,
        tableName: 'consumer_products',
      });

  products.associate = (models) => {
    products.belongsTo(models.bills);
    products.belongsTo(models.users,
        {foreignKey: 'user_id', as: 'consumer'});
    products.belongsTo(models.users,
        {foreignKey: 'updated_by', as: 'updatedByUser'});

    products.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    products.belongsTo(models.jobs, {as: 'jobs', foreignKey: 'job_id'});
    products.belongsTo(models.offlineSellers,
        {foreignKey: 'seller_id', as: 'sellers'});
    products.belongsTo(models.brands,
        {foreignKey: 'brand_id', as: 'brand'});
    products.belongsTo(models.categories,
        {foreignKey: 'main_category_id', as: 'mainCategory'});
    products.belongsTo(models.categories,
        {foreignKey: 'category_id', as: 'category'});
    products.belongsTo(models.colours,
        {foreignKey: 'colour_id', as: 'color'});
    products.hasMany(models.metaData,
        {foreignKey: 'product_id', as: 'metaData'});

    products.hasMany(models.productReviews,
        {foreignKey: 'bill_product_id', as: 'productReviews'});
  };

  return products;
};
