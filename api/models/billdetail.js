/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bill_copies', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_copy_id'
  },
  BillID: {
    type: Sequelize.INTEGER,
    field: 'bill_id'
  },
  CopyName: {
    type: Sequelize.STRING,
    field: 'bill_copy_name'
  },
  CopyType: {
    type: Sequelize.STRING,
    field: 'bill_copy_type'
  },
  updated_by_user_id: {
    type: Sequelize.INTEGER
  },
  uploaded_by_id: {
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
