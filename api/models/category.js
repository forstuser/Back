/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_categories', {
  category_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  display_id: {
    type: Sequelize.INTEGER
  },
  category_name: {
    type: Sequelize.STRING,
    notEmpty: false
  },
  ref_id: {
    type: Sequelize.INTEGER
  },
  category_level: {
    type: Sequelize.STRING
  },
  created_on: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_0n: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW
  },
  updated_by: {
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
