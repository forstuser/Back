/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_online_seller_details', {
  DetailID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'seller_detail_id'
  },
  SellerID: {
    type: Sequelize.INTEGER,
    notEmpty: true,
    field: 'seller_id'
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
