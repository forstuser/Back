/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('offlineSellerDetails', {
  seller_detail_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  offline_seller_id: {
    type: Sequelize.INTEGER,
    notEmpty: true
  },
  contactdetail_type_id: {
    type: Sequelize.INTEGER
  },
  display_name: {
    type: Sequelize.STRING,
    notEmpty: false
  },
  details: {
    type: Sequelize.STRING
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_offline_seller_details'
});