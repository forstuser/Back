/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('insuranceBills', {
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'bill_insurance_id'
  },
  BillProductID: {
    type: Sequelize.INTEGER,
    field: 'bill_product_id'
  },
  ProviderType: {
    type: Sequelize.INTEGER,
    field: 'insurance_provider_type'
  },
  ProviderID: {
    type: Sequelize.INTEGER,
    field: 'insurance_provider_id'
  },
  Plan: {
    type: Sequelize.STRING,
    field: 'insurance_plan'
  },
  PolicyNo: {
    type: Sequelize.STRING,
    field: 'policy_number'
  },
  AmountInsured: {
    type: Sequelize.FLOAT,
    field: 'amount_insured'
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
    type: Sequelize.INTEGER
  }
}, {
  freezeTableName: true,
  defaultPrimaryKey: false,
  timestamps: false,
  tableName: 'table_consumer_bill_insurance'
});
