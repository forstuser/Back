'use strict';

export default (sequelize, DataTypes) => {
  const offerCategories = sequelize.define('offerCategories', {
        category_name: {
          type: DataTypes.STRING,
        },
        category_name_hi: {
          type: DataTypes.STRING,
        },
        category_name_ta: {
          type: DataTypes.STRING,
        },
        category_name_bn: {
          type: DataTypes.STRING,
        },
        category_name_ml: {
          type: DataTypes.STRING,
        },
        category_name_te: {
          type: DataTypes.STRING,
        },
        category_name_gu: {
          type: DataTypes.STRING,
        },
        category_name_kn: {
          type: DataTypes.STRING,
        },
        category_name_mr: {
          type: DataTypes.STRING,
        },
        ref_id: {
          'type': DataTypes.INTEGER,
        },
        priority: {
          'type': DataTypes.INTEGER,
        },
        category_level: {
          'type': DataTypes.INTEGER,
        },
        category_image_name: {
          'type': DataTypes.STRING,
        },
        updated_by: {
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
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'table_offer_categories',
      });

  offerCategories.associate = (models) => {
    offerCategories.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    offerCategories.belongsTo(models.offerCategories,
        {foreignKey: 'ref_id', as: 'categories'});
    offerCategories.hasMany(models.offerCategories,
        {foreignKey: 'ref_id', as: 'subCategories'});
    offerCategories.hasMany(models.offerProductsDiscount,
        {foreignKey: 'category_id', as: 'offers'});
    offerCategories.hasMany(models.offerProductsDiscount,
        {foreignKey: 'main_category_id', as: 'main_offers'});
    offerCategories.hasMany(models.offerProductsCashback,
        {foreignKey: 'category_id', as: 'offers_cashback'});
    offerCategories.hasMany(models.offerProductsCashback,
        {foreignKey: 'main_category_id', as: 'main_offers_cashback'});
    offerCategories.hasMany(models.offerProductsOther,
        {foreignKey: 'category_id', as: 'offers_other'});
    offerCategories.hasMany(models.offerProductsOther,
        {foreignKey: 'main_category_id', as: 'main_offers_other'});

    offerCategories.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
  };
  return offerCategories;
};
