/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = function(sequelize, DataTypes) {
  var brandReviews = sequelize.define('brandReviews', {
    brand_review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    brand_id: {
      type: DataTypes.INTEGER,
      notEmpty: true,
    },
    review_ratings: {
      type: DataTypes.FLOAT,
    },
    review_feedback: {
      type: DataTypes.STRING,
    },
    review_comments: {
      type: DataTypes.STRING,
    },
    status_id: {
      type: DataTypes.INTEGER,
    },
    user_id: {
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
  }, {
    freezeTableName: true,
    timestamps: true,
    underscored: true,
    defaultPrimaryKey: false,
    tableName: 'table_brand_reviews',
  });

  brandReviews.associate = function(models) {
    brandReviews.belongsTo(models.users, {foreignKey: 'user_id'});
    brandReviews.belongsTo(models.brands, {foreignKey: 'brand_id'});
  };
  return brandReviews;
};