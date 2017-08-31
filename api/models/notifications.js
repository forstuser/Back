/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => sequelize.define('mailBox', {
  notification_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  bill_product_id: {
    type: DataTypes.INTEGER(11)
  },
  seller_type: {
    type: DataTypes.INTEGER(11)
  },
  seller_id: {
    type: DataTypes.INTEGER(11)
  },
  total_amount: {
    type: DataTypes.FLOAT
  },
  taxes: {
    type: DataTypes.FLOAT
  },
  due_amount: {
    type: DataTypes.FLOAT
  },
  due_date: {
    type: DataTypes.DATE
  },
  notification_type: {
    type: DataTypes.INTEGER(11)
  },
  title: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING(2000)
  },
  bill_copy_id: {
    type: DataTypes.INTEGER(11)
  },
  status_id: {
    type: DataTypes.INTEGER(11),
    defaultValue: 4
  }
}, {
  freezeTableName: true,
  tableName: 'table_inbox_notification'
});
