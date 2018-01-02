'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = function(sequelize, DataTypes) {
  var insuranceBrandCategories = sequelize.define('insuranceBrandCategories', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    insurance_brand_id: {
      type: DataTypes.INTEGER,
    },
    category_id: {
      type: DataTypes.INTEGER,
    },
    updated_by: {
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
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'insurance_brand_categories',
  });

  insuranceBrandCategories.associate = function(models) {
    insuranceBrandCategories.belongsTo(models.users,
        {foreignKey: 'updated_by'});

    insuranceBrandCategories.belongsTo(models.statuses,
        {foreignKey: 'status_type', targetKey: 'status_type'});
    insuranceBrandCategories.belongsTo(models.insuranceBrands,
        {foreignKey: 'insurance_brand_id'});
    insuranceBrandCategories.belongsTo(models.categories,
        {foreignKey: 'category_id'});
  };
  return insuranceBrandCategories;
};