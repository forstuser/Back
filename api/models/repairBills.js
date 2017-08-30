/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => sequelize.define('repairBills', {
  bill_repair_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER(11)
  },
  bill_product_id: {
    type: DataTypes.INTEGER(11)
  },
  seller_type: {
    type: DataTypes.INTEGER(11)
  },
  seller_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  value_of_repair: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  taxes: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  repair_invoice_number: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  repair_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_repair'
});
