/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('warranty', {
  ID: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
    field: 'bill_warranty_id'
  },
  BillProductID: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    field: 'bill_product_id'
  },
  ProvideType: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    field: 'warranty_provider_type'
  },
  ProviderID: {
    type: Sequelize.INTEGER(11),
    allowNull: false,
    field: 'warranty_provider_id'
  },
  WarrantyType: {
    type: Sequelize.STRING(100),
    allowNull: false,
    field: 'warranty_type'
  },
  PolicyNo: {
    type: Sequelize.STRING,
    field: 'policy_number'
  },
  PremiumType: {
    type: Sequelize.ENUM('Yearly','HalfYearly','Quarterly','Monthly','Weekly','Daily'),
    allowNull: false,
    defaultValue: 'Yearly',
    field: 'premium_type'
  },
  PremiumAmount: {
    type:Sequelize.FLOAT,
    field: 'premium_amount'
  },
  EffectiveDate: {
    type: Sequelize.DATE(6),
    default: Sequelize.NOW,
    field: 'policy_effective_date'
  },
  ExpiryDate: {
    type: Sequelize.DATE(6),
    default: Sequelize.NOW,
    field: 'policy_expiry_date'
  },
  status_id: {
    type: Sequelize.INTEGER(11),
    allowNull: false
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_warranty'
});
