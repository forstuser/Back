'use strict';

export default (sequelize, DataTypes) => {
  const categories = sequelize.define('categories', {
        category_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          unique: true,
        },
        category_name: {
          type: DataTypes.STRING,
        },
        category_name_hi: {
          type: DataTypes.STRING,
        },
        category_name_en: {
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
        type_category_form: {
          'type': DataTypes.INTEGER,
        },
        category_form_1: {
          'type': DataTypes.INTEGER,
        },
        category_form_2: {
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
          defaultValue: 1,
        },
        created_by: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        status_type: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: sequelize.literal('NOW()'),
        },
        brand_ids: {
          type: DataTypes.JSONB,
        },
        dual_warranty_item: {
          type: DataTypes.STRING,
        },
        priority_index: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: false,
        timestamps: true,
        underscored: true,
        tableName: 'categories',
      });

  categories.associate = (models) => {
    categories.belongsTo(models.users,
        {foreignKey: 'updated_by'});
    categories.belongsTo(models.users,
        {foreignKey: 'created_by'});
    categories.belongsTo(models.categories,
        {foreignKey: 'ref_id'});
    categories.hasMany(models.categories,
        {foreignKey: 'ref_id', as: 'subCategories'});
    categories.hasMany(models.products,
        {foreignKey: 'category_id', as: 'products'});
    categories.hasMany(models.products,
        {foreignKey: 'main_category_id', as: 'main_products'});
    categories.hasMany(models.products,
        {foreignKey: 'sub_category_id', as: 'sub_products'});
    categories.hasMany(models.table_accessory_categories,
        {foreignKey: 'category_id', as: 'accessories'});

    categories.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    categories.belongsToMany(models.insuranceBrands,
        {
          foreignKey: 'category_id',
          otherKey: 'insurance_brand_id',
          through: 'insurance_brand_categories',
          as: 'insuranceProviders',
        });
  };
  return categories;
};
