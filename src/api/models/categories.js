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
        },
        status_type: {
          type: DataTypes.INTEGER,
        },
        created_at: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATEONLY,
          defaultValue: sequelize.literal('NOW()'),
        },
        dual_warranty_item: {
          type: DataTypes.STRING,
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
    categories.belongsTo(models.categories,
        {foreignKey: 'ref_id'});
    categories.hasMany(models.categories,
        {foreignKey: 'ref_id', as: 'subCategories'});

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
