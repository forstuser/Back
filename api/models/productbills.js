/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('productBills', {
  bill_product_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  billDetailID: {
    type: Sequelize.INTEGER,
    field: 'bill_detail_id'
  },
  product_name: {
    type: Sequelize.STRING
  },
  masterCatID: {
    type: Sequelize.INTEGER,
    field: 'master_category_id'
  },
  catID: {
    type: Sequelize.INTEGER,
    field: 'category_id'
  },
  brandID: {
    type: Sequelize.INTEGER,
    field: 'brand_id'
  },
  colorID: {
    type: Sequelize.INTEGER,
    field: 'color_id'
  },
  sellerType: {
    type: Sequelize.INTEGER,
    field: 'seller_type'
  },
  sellerID: {
    type: Sequelize.INTEGER,
    field: 'seller_id'
  },
  value: {
    type: Sequelize.FLOAT,
    field: 'value_of_purchase'
  },
  taxes: {
    type: Sequelize.FLOAT,
    field: 'taxes'
  },
  tag: {
    type: Sequelize.STRING,
    field: 'tag'
  },
  user_id: {
    type: Sequelize.INTEGER
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
