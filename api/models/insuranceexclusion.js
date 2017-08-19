/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bill_insurance_exclusions', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'insurance_exclusions_id'
  },
  bill_insurance_id: {
    type: Sequelize.INTEGER,
    field: 'bill_insurance_id'
  },
  exclusions_id: {
    type: Sequelize.INTEGER,
    field: 'exclusions_id'
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
