/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('insuranceInclusion', {
  insurance_inclusions_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  bill_insurance_id: {
    type: Sequelize.INTEGER
  },
  inclusions_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_insurance_inclusions'
});
