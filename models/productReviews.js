/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('productReviews', {
  product_review_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  bill_product_id: {
    type: Sequelize.INTEGER,
    notEmpty: true
  },
  review_ratings: {
    type: Sequelize.FLOAT
  },
  review_feedback: {
    type: Sequelize.STRING,
    notEmpty: false
  },
  review_comments: {
    type: Sequelize.STRING
  },
  status_id: {
    type: Sequelize.INTEGER
  },
  user_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  tableName: 'table_product_reviews'
});
