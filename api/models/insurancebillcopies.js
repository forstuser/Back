/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('insuranceBillCopies', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  bill_insurance_id: {
    type: Sequelize.INTEGER
  },
  bill_copy_id: {
    type: Sequelize.INTEGER(11)
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_insurance_copies'
});
