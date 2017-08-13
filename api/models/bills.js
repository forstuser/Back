/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bills', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_id'
  },
  BillRefID: {
    type: Sequelize.INTEGER,
    field: 'bill_reference_id'
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
  uploaded_by: {
    type: Sequelize.INTEGER
  },
  user_status: {
    type: Sequelize.INTEGER
  },
  admin_status: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});