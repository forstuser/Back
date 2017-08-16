/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_status', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'status_id'
  },
  Name: {
    type: Sequelize.STRING,
    field: 'status_name'
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
