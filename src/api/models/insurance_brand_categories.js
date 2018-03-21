'use strict';

export default (sequelize, DataTypes) => {
  const insuranceBrandCategories = sequelize.define('insuranceBrandCategories',
      {
        insurance_brand_id: {
          type: DataTypes.INTEGER,
        },
        category_id: {
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
      },
      {
        freezeTableName: true,
        defaultPrimaryKey: true,
        timestamps: true,
        underscored: true,
        tableName: 'insurance_brand_categories',
      });

  insuranceBrandCategories.associate = (models) => {
    insuranceBrandCategories.belongsTo(models.insuranceBrands,
        {foreignKey: 'insurance_brand_id'});
    insuranceBrandCategories.belongsTo(models.categories,
        {foreignKey: 'category_id'});
  };
  return insuranceBrandCategories;
};
