/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_category_form', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'category_form_id'
  },
  category_id: {
    type: Sequelize.INTEGER
  },
  Name: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'form_element_name'
  },
  Type: {
    type: Sequelize.INTEGER,
    field: 'form_element_type'
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
