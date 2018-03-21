'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  var amcs = sequelize.define('amcs', {
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
      type: DataTypes.INTEGER
    },
    renewal_cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    renewal_taxes: {
      type: DataTypes.FLOAT,
      defaultValue: 0
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
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    updated_at: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    effective_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    document_date: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('NOW()')
    },
    copies: {
      type: DataTypes.ARRAY(DataTypes.JSONB)
    }
  }, {
    freezeTableName: true,
    defaultPrimaryKey: true,
    timestamps: true,
    underscored: true,
    tableName: 'consumer_amcs'
  });

  amcs.associate = function (models) {
    amcs.belongsTo(models.products, { foreignKey: 'product_id' });
    amcs.belongsTo(models.users, { foreignKey: 'user_id', as: 'consumer' });
    amcs.belongsTo(models.users, { foreignKey: 'updated_by', as: 'updatedByUser' });

    amcs.belongsTo(models.statuses, { foreignKey: 'status_type', targetKey: 'status_type' });
    amcs.belongsTo(models.jobs, { as: 'jobs', foreignKey: 'job_id' });
    amcs.belongsTo(models.onlineSellers, { foreignKey: 'online_seller_id', as: 'onlineSellers' });
    amcs.belongsTo(models.offlineSellers, { foreignKey: 'seller_id', as: 'sellers' });
    amcs.belongsTo(models.renewalTypes, { foreignKey: 'renewal_type', targetKey: 'type' });
  };

  return amcs;
};