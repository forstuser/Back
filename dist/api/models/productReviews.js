/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = function(sequelize, DataTypes) {
  var productReviews = sequelize.define('productReviews', {
    product_review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    bill_product_id: {
      type: DataTypes.INTEGER,
      notEmpty: true,
    },
    review_ratings: {
      type: DataTypes.FLOAT,
    },
    review_feedback: {
      type: DataTypes.STRING,
      notEmpty: false,
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
    tableName: 'table_product_reviews',
  });

  productReviews.associate = function(models) {
    productReviews.belongsTo(models.users, {foreignKey: 'user_id'});
    productReviews.belongsTo(models.products, {foreignKey: 'bill_product_id'});
  };

  return productReviews;
};