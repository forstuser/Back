/*jshint esversion: 6 */
'use strict';

export default (sequelize, DataTypes) => {
  const seller_reviews = sequelize.define('seller_reviews', {
    seller_id: {
      type: DataTypes.INTEGER,
    },
    offline_seller_id: {
      type: DataTypes.INTEGER,
    },
    order_id: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()'),
    },
  }, {
    freezeTableName: true,
    timestamps: true,
    underscored: true,
    defaultPrimaryKey: true,
    tableName: 'table_seller_reviews',
  });
  seller_reviews.associate = (models) => {
    seller_reviews.belongsTo(models.users,
        {foreignKey: 'user_id'});
    seller_reviews.belongsTo(models.sellers,
        {foreignKey: 'offline_seller_id'});
    seller_reviews.belongsTo(models.onlineSellers, {foreignKey: 'seller_id'});
    seller_reviews.belongsTo(models.order, {foreignKey: 'order_id'});
  };

  return seller_reviews;
}
