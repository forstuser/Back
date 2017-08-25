/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('amcInclusion', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'amc_inclusions_id'
  },
  bill_amc_id: {
    type: Sequelize.INTEGER,
    field: 'bill_amc_id'
  },
  inclusions_id: {
    type: Sequelize.INTEGER,
    field: 'inclusions_id'
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
      tableName:'table_consumer_bill_amc_inclusions'
});