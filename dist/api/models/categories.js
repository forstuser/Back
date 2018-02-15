'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var categories = sequelize.define('categories', {
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    category_name: {
      type: DataTypes.STRING
    },
    ref_id: {
      'type': DataTypes.INTEGER
    },
    type_category_form: {
      'type': DataTypes.INTEGER
    },
    category_form_1: {
      'type': DataTypes.INTEGER
    },
    category_form_2: {
      'type': DataTypes.INTEGER
    },
    category_level: {
      'type': DataTypes.INTEGER
    },
    category_image_name: {
      'type': DataTypes.STRING
    },
    updated_by: {
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
    dual_warranty_item: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'categories'
  });

  categories.associate = function (models) {
    categories.belongsTo(models.users, { foreignKey: 'updated_by' });
    categories.belongsTo(models.categories, { foreignKey: 'ref_id' });
    categories.hasMany(models.categories, { foreignKey: 'ref_id', as: 'subCategories' });

    categories.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    categories.belongsToMany(models.insuranceBrands, {
      foreignKey: 'category_id',
      otherKey: 'insurance_brand_id',
      through: 'insurance_brand_categories',
      as: 'insuranceProviders'
    });
  };
  return categories;
};