/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('productMetaData', {
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
  form_element_value: {
    type: Sequelize.STRING,
    notEmpty: false
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_product_meta_data'
});
