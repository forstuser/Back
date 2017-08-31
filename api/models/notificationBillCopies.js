/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => sequelize.define('mailboxCopies', {
  id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  notification_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  bill_copy_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_notification_copies'
});
