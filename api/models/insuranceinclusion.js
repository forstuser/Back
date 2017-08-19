/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bill_insurance_inclusions', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'insurance_inclusions_id'
  },
  bill_insurance_id: {
    type: Sequelize.INTEGER,
    field: 'bill_insurance_id'
  },
  inclusions_id: {
    type: Sequelize.INTEGER,
    field: 'inclusions_id'
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
