/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('warrantyInclusion', {
  ID : {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'warranty_inclusions_id'
  },
  bill_warranty_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  },
  inclusions_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  }
}, {
  tableName: 'table_consumer_bill_warranty_inclusions',
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
});
