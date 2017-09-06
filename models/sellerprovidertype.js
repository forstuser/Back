
module.exports = (sequelize, Sequelize) => sequelize.define('sellerProviderType', {
    seller_provider_type_id: {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    seller_provider_type_name: {
      type: Sequelize.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'table_seller_provider_type',
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false
  });
