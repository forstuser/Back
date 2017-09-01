/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('brandDetails', {
  brand_detail_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'brand_detail_id'
  },
  brand_id: {
    type: Sequelize.INTEGER,
    notEmpty: true
  },
  contactdetails_type_id: {
    type: Sequelize.INTEGER
  },
  display_name: {
    type: Sequelize.STRING,
    notEmpty: false
  },
  details: {
    type: Sequelize.STRING
  },
  category_id: {
    type: Sequelize.INTEGER
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_brand_details'
});
