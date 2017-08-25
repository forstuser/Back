/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('billDetailCopies', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'id'
  },
  BillID: {
    type: Sequelize.INTEGER,
    field: 'bill_detail_id'
  },
  bill_copy_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_details_copies'
});