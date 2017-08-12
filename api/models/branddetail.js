/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_brand_details', {
  DetailID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'brand_detail_id'
  },
  BrandID: {
    type: Sequelize.INTEGER,
    notEmpty: true,
    field: 'brand_id'
  },
  DetailTypeID: {
    type: Sequelize.INTEGER,
    field: 'contactdetails_type_id'
  },
  DisplayName: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'display_name'
  },
  Details: {
    type: Sequelize.STRING,
    field: 'details'
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
