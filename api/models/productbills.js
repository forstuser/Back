/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('productBills', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_product_id'
  },
  BillDetailID: {
    type: Sequelize.INTEGER,
    field: 'bill_detail_id'
  },
  ProductName: {
    type: Sequelize.STRING,
    field: 'product_name'
  },
  MasterCatID: {
    type: Sequelize.INTEGER,
    field: 'master_category_id'
  },
  CatID: {
    type: Sequelize.INTEGER,
    field: 'category_id'
  },
  BrandID: {
    type: Sequelize.INTEGER,
    field: 'brand_id'
  },
  ColorID: {
    type: Sequelize.INTEGER,
    field: 'color_id'
  },
  Value: {
    type: Sequelize.FLOAT,
    field: 'value_of_purchase'
  },
  Taxes: {
    type: Sequelize.FLOAT,
    field: 'taxes'
  },
  Tag: {
    type: Sequelize.STRING,
    field: 'tag'
  },
  status_id: {
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_products'
});
