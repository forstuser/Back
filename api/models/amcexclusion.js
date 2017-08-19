/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('amcExclusion', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'amc_exclusions_id'
  },
  bill_amc_id: {
    type: Sequelize.INTEGER,
    field: 'bill_amc_id'
  },
  exclusions_id: {
    type: Sequelize.INTEGER,
    field: 'exclusions_id'
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_amc_exclusions'
});
