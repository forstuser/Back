/**
 * Created by arpit on 6/30/2017.
 */

module.exports = (sequelize, Sequelize) => sequelize.define('insuranceBills', {
  bill_insurance_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  billProductID: {
    type: Sequelize.INTEGER,
    field: 'bill_product_id'
  },
  sellerType: {
    type: Sequelize.INTEGER,
    field: 'seller_type'
  },
  sellerID: {
    type: Sequelize.INTEGER,
    field: 'seller_id'
  },
  plan: {
    type: Sequelize.STRING,
    field: 'insurance_plan'
  },
  policyNo: {
    type: Sequelize.STRING,
    field: 'policy_number'
  },
  amountInsured: {
    type: Sequelize.FLOAT,
    field: 'amount_insured'
  },
  premiumType: {
    type: Sequelize.ENUM('Yearly', 'HalfYearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'),
    allowNull: false,
    defaultValue: 'Yearly',
    field: 'premium_type'
  },
  premiumAmount: {
    type: Sequelize.FLOAT,
    field: 'premium_amount'
  },
  effectiveDate: {
    type: Sequelize.DATE(6),
    default: Sequelize.NOW,
    field: 'policy_effective_date'
  },
  expiryDate: {
    type: Sequelize.DATE(6),
    default: Sequelize.NOW,
    field: 'policy_expiry_date'
  },
  user_id: {
    type: Sequelize.INTEGER
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
