/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var sellerReviews = sequelize.define('sellerReviews', {
    seller_review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    offline_seller_id: {
      type: DataTypes.INTEGER
    },
    review_ratings: {
      type: DataTypes.FLOAT
    },
    review_feedback: {
      type: DataTypes.STRING,
      notEmpty: false
    },
    review_comments: {
      type: DataTypes.STRING
    },
    status_id: {
      type: DataTypes.INTEGER
    },
    user_id: {
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
    timestamps: true,
    underscored: true,
    defaultPrimaryKey: false,
    tableName: 'table_seller_reviews'
  });
  sellerReviews.associate = function (models) {
    sellerReviews.belongsTo(models.users, { foreignKey: 'user_id' });
    sellerReviews.belongsTo(models.offlineSellers, { foreignKey: 'offline_seller_id' });
    sellerReviews.belongsTo(models.onlineSellers, { foreignKey: 'seller_id' });
  };

  return sellerReviews;
};