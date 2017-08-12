/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bill_details', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_detail_id'
  },
  BillID: {
    type: Sequelize.INTEGER,
    field: 'bill_id'
  },
  created_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  user_id: {
    type: Sequelize.INTEGER
  },
  updated_by_user_id: {
    type: Sequelize.INTEGER
  },
  uploaded_by_id: {
    type: Sequelize.INTEGER
  },
  user_status_id: {
    type: Sequelize.INTEGER
  },
  admin_status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
