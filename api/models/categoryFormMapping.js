/* jshint indent: 2 */

module.exports = (sequelize, DataTypes) => sequelize.define('categoryFormMapping', {
  mapping_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  category_form_id: {
    type: DataTypes.INTEGER(11),
    allowNull: false
  },
  dropdown_name: {
    type: DataTypes.STRING(200),
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
  tableName: 'table_category_form_mapping'
});
