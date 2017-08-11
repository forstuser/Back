/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_categories', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'category_id'
  },
  display_id: {
    type: Sequelize.INTEGER
  },
  Name: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'category_name'
  },
  RefID: {
    type: Sequelize.INTEGER,
    field: 'ref_id'
  },
  Level: {
    type: Sequelize.INTEGER,
    field: 'category_level'
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
