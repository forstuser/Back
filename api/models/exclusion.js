/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_list_of_exclusions', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'exclusions_id'
  },
  CatID: {
    type: Sequelize.INTEGER,
    field: 'category_id'
  },
  Name: {
    type: Sequelize.STRING,
    field: 'exclusions_name'
  },
  created_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_by_user_id: {
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
