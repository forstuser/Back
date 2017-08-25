/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => sequelize.define('billMapping', {
  id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  bill_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  bill_ref_type: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  ref_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_mapping'
});
