/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_brands', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'brand_id'
  },
  Name: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'brand_name'
  },
  Description: {
    type: Sequelize.INTEGER,
    field: 'brand_description'
  },
  created_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
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
