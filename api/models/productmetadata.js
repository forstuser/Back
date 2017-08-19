/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('table_consumer_bill_product_meta_data', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'id'
  },
  bill_product_id: {
    type: Sequelize.INTEGER
  },
  category_form_id: {
    type: Sequelize.INTEGER
  },
  Value: {
    type: Sequelize.STRING,
    notEmpty: false,
    field: 'form_element_value'
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
