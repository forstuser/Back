/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('categories', {
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
    type: Sequelize.INTEGER
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
  },
  category_image_name: {
    type: Sequelize.STRING(255)
  },
  category_image_type: {
    type: Sequelize.STRING(45)
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_categories'
});
