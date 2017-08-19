/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('consumerBillDetails', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_detail_id'
  },
  BillID: {
    type: Sequelize.INTEGER,
    field: 'bill_id'
  },
  Name: {
    type: Sequelize.STRING,
    field: 'consumer_name'
  },
  EmailAddress: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true
    },
    field: 'consumer_email_id'
  },
  PhoneNo: {
    type: Sequelize.STRING,
    field: 'consumer_phone_no'
  },
  DocID: {
    type: Sequelize.INTEGER,
    field: 'document_id'
  },
  InvoiceNo: {
    type: Sequelize.STRING,
    field: 'invoice_number'
  },
  TotalValue: {
    type: Sequelize.FLOAT,
    field: 'total_purchase_value'
  },
  Taxes: {
    type: Sequelize.FLOAT,
    field: 'taxes'
  },
  PurchaseDate: {
    type: Sequelize.DATE(6),
    defaultValue: Sequelize.NOW,
    field: 'purchase_date'
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
  timestamps: false,
  tableName: 'table_consumer_bill_details'
});
