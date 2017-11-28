'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var brands = sequelize.define('brands', {
    brand_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    brand_name: {
      type: DataTypes.STRING
    },
    brand_description: {
      type: DataTypes.STRING
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
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: false,
    timestamps: true,
    underscored: true,
    tableName: 'brands'
  });

  brands.associate = function (models) {
    brands.belongsTo(models.users, { foreignKey: 'updated_by' });

    brands.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    brands.hasMany(models.brandDetails, { foreignKey: 'brand_id', targetKey: 'brand_id', as: 'details' });
    brands.belongsToMany(models.serviceCenters, {
      otherKey: 'center_id',
      foreignKey: 'brand_id',
      through: 'center_brand_mapping',
      as: 'centers'
    });
    brands.hasMany(models.brandReviews, { foreignKey: 'brand_id', as: 'brandReviews' });
  };
  return brands;
};