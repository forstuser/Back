'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var insurances = sequelize.define('insurances', {
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    job_id: {
      type: DataTypes.INTEGER
    },
    online_seller_id: {
      type: DataTypes.INTEGER
    },
    document_number: {
      type: DataTypes.STRING
    },
    renewal_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    renewal_cost: {
      type: DataTypes.FLOAT
    },
    renewal_taxes: {
      type: DataTypes.FLOAT
    },
    user_id: {
      type: DataTypes.INTEGER
    },
    updated_by: {
      type: DataTypes.INTEGER
    },
    seller_id: {
      type: DataTypes.INTEGER
    },
    status_type: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    effective_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    expiry_date: {
      type: DataTypes.DATE
    },
    document_date: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()')
    },
    copies: {
      type: DataTypes.ARRAY(DataTypes.JSON)
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'consumer_insurances'
  });

  insurances.associate = function (models) {
    insurances.belongsTo(models.products);
    insurances.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    insurances.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });

    insurances.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    insurances.belongsTo(models.jobs, { as: 'jobs' });
    insurances.belongsTo(models.onlineSellers, { foreignKey: 'online_seller_id', as: 'onlineSellers' });
    insurances.belongsTo(models.offlineSellers, { foreignKey: 'seller_id', as: 'sellers' });
    insurances.belongsTo(models.renewalTypes, { foreignKey: 'renewal_type', targetKey: 'type' });
  };

  return insurances;
};