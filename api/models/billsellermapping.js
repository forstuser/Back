/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bill_seller_mapping', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_seller_info_id'
  },
  bill_detail_id: {
    type: Sequelize.INTEGER
  },
  ref_type: {
    type: Sequelize.INTEGER
  },
  seller_ref_id: {
    type: Sequelize.STRING,
    notEmpty: false,
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
