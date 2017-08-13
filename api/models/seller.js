/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_online_seller', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'seller_id'
  },
  Name: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'seller_name'
  },
  URL: {
    type: Sequelize.INTEGER,
    field: 'seller_url'
  },
  GstinNo: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW,
    field: 'seller_gstin_no'
  },
  updated_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_by_user_id: {
    type: Sequelize.INTEGER
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});