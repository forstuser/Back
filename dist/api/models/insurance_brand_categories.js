'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var insuranceBrandCategories = sequelize.define('insuranceBrandCategories', {
    insurance_brand_id: {
      type: DataTypes.INTEGER
    },
    category_id: {
      type: DataTypes.INTEGER
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
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'insurance_brand_categories'
  });

  insuranceBrandCategories.associate = function (models) {
    insuranceBrandCategories.belongsTo(models.insuranceBrands, { foreignKey: 'insurance_brand_id' });
    insuranceBrandCategories.belongsTo(models.categories, { foreignKey: 'category_id' });
  };
  return insuranceBrandCategories;
};